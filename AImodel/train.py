# Import required libraries
import pandas as pd  # For data manipulation and reading Excel files
import numpy as np   # For numerical operations and array handling
import torch         # PyTorch for building and training neural networks
import torch.nn as nn  # Neural network modules
from torch.utils.data import Dataset, DataLoader  # For custom datasets and batching
from sklearn.model_selection import train_test_split  # For splitting data into train/test sets
from sklearn.preprocessing import LabelEncoder  # For encoding categorical labels
import os            # For file and directory operations
import sys          # For system-specific parameters and functions
import traceback    # For detailed error traceback
import json         # For saving hyperparameters as JSON

# Print startup message for debugging
print("Starting train.py...")

# Define the EmotionTransformer model, a transformer-based neural network for emotion classification
class EmotionTransformer(nn.Module):
    def __init__(self, input_dim, hidden_dim, n_layers, n_heads, dropout, n_classes):
        # Initialize the parent class (nn.Module)
        super().__init__()
        # Linear layer to project input features to hidden dimension
        self.input_proj = nn.Linear(input_dim, hidden_dim)
        # Define a single transformer encoder layer with specified parameters
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=hidden_dim,           # Dimension of the model
            nhead=n_heads,                # Number of attention heads
            dim_feedforward=hidden_dim * 4,  # Feedforward network dimension
            dropout=dropout,              # Dropout rate for regularization
            batch_first=True              # Input format: (batch, seq, feature)
        )
        # Stack multiple transformer encoder layers
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=n_layers)
        # Final linear layer to output class probabilities
        self.fc = nn.Linear(hidden_dim, n_classes)
        # Dropout layer for additional regularization
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        # Project input features to hidden dimension
        x = self.input_proj(x)
        # Add a sequence dimension (batch, 1, hidden_dim) for transformer
        x = x.unsqueeze(1)
        # Pass through transformer encoder
        x = self.transformer(x)
        # Remove sequence dimension (batch, hidden_dim)
        x = x.squeeze(1)
        # Apply dropout
        x = self.dropout(x)
        # Output class logits
        x = self.fc(x)
        return x

# Custom dataset class for emotion data
class EmotionDataset(Dataset):
    def __init__(self, features, labels, augment=False):
        # Convert features and labels to PyTorch tensors
        self.features = torch.FloatTensor(features)
        self.labels = torch.LongTensor(labels)
        # Flag to enable data augmentation
        self.augment = augment

    def __len__(self):
        # Return the number of samples
        return len(self.labels)

    def __getitem__(self, idx):
        # Get features for the given index
        features = self.features[idx]
        # Apply data augmentation (add Gaussian noise) if enabled
        if self.augment:
            noise = torch.normal(0, 0.01, features.shape)
            features = features + noise
        # Return features and corresponding label
        return features, self.labels[idx]

# Function to load and preprocess the dataset
def load_data(file_path):
    print(f"Loading dataset from: {file_path}")
    try:
        # Read the Excel file into a pandas DataFrame
        df = pd.read_excel(file_path)
        print(f"Raw dataset shape: {df.shape}")
        
        # Remove rows with missing or invalid 'Expression' values
        df = df.dropna(subset=['Expression'])
        df = df[df['Expression'].astype(str).str.lower() != 'nan']
        print(f"Shape after removing invalid labels: {df.shape}")
        
        # Filter for valid emotion labels
        valid_emotions = ['Angry', 'Disgust', 'Fear', 'Happy', 'Neutral', 'Sad']
        df = df[df['Expression'].isin(valid_emotions)]
        if df.empty:
            raise ValueError("No valid emotions found in dataset after filtering.")
        print(f"Shape after filtering valid emotions: {df.shape}")
        
        # Extract feature columns (all except 'Expression' and 'FileName')
        feature_cols = [col for col in df.columns if col not in ['Expression', 'FileName']]
        features = df[feature_cols].values
        # Handle NaN or infinite values in features by replacing with zeros
        if np.any(np.isnan(features)) or np.any(np.isinf(features)):
            print("Warning: Found nan or infinite values in features. Imputing with zeros...")
            features = np.nan_to_num(features, nan=0.0, posinf=0.0, neginf=0.0)        
        # Normalize features using mean and standard deviation
        mean = features.mean(axis=0)
        std = features.std(axis=0) + 1e-8  # Add small epsilon to avoid division by zero
        features = (features - mean) / std
        # Encode emotion labels as integers
        label_encoder = LabelEncoder()
        labels = label_encoder.fit_transform(df['Expression'])
        print(f"Unique emotions: {df['Expression'].unique()}")
        print(f"Label mapping: {dict(zip(label_encoder.classes_, range(len(label_encoder.classes_))))}")
        print(f"Feature columns count: {len(feature_cols)}")
        # Return features, labels, encoder, and normalization parameters
        return features, labels, label_encoder, mean, std
    except Exception as e:
        print(f"Error in load_data: {e}")
        traceback.print_exc()
        sys.exit(1)

# Main function to train the model
def train_model():
    print("Entering train_model...")
    # Define hyperparameters
    input_dim = 468 * 3  # Expected input size (468 facial landmarks * 3 coordinates)
    hidden_dim = 128     # Hidden layer size (matches app.py)
    n_layers = 1         # Number of transformer layers (matches app.py)
    n_heads = 8          # Number of attention heads
    dropout = 0.3        # Dropout rate
    batch_size = 32      # Number of samples per batch
    epochs = 50          # Number of training epochs
    learning_rate = 0.0001  # Learning rate for optimizer

    # Load dataset
    dataset_path = "C:\\Users\\SAI PRANAV\\Desktop\\Expression Tracker\\JOY_VERSE_FACEMESH\\AImodel\\JoyVerseDataset_Filled.xlsx"
    print(f"Resolved dataset path: {os.path.abspath(dataset_path)}")
    features, labels, label_encoder, mean, std = load_data(dataset_path)
    n_classes = len(label_encoder.classes_)
    print(f"Number of classes: {n_classes}")
    if n_classes != 6:
        print(f"Warning: Expected 6 classes, got {n_classes}. Check dataset labels.")

    # Save normalization parameters and hyperparameters
    os.makedirs('backend', exist_ok=True)
    np.save('backend/mean.npy', mean)
    np.save('backend/std.npy', std)
    hyperparams = {
        'input_dim': input_dim,
        'hidden_dim': hidden_dim,
        'n_layers': n_layers,
        'n_heads': n_heads,
        'dropout': dropout,
        'n_classes': n_classes
    }
    with open('backend/model_hyperparams.json', 'w') as f:
        json.dump(hyperparams, f)
    print("Saved hyperparameters to backend/model_hyperparams.json")

    # Split data into training and testing sets (80-20 split)
    print("Splitting data...")
    X_train, X_test, y_train, y_test = train_test_split(
        features, labels, test_size=0.2, random_state=42
    )

    # Create datasets with augmentation for training
    print("Creating datasets...")
    train_dataset = EmotionDataset(X_train, y_train, augment=True)
    test_dataset = EmotionDataset(X_test, y_test, augment=False)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size)

    # Initialize the model
    print("Initializing model...")
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    print(f"Using device: {device}")
    model = EmotionTransformer(
        input_dim=input_dim,
        hidden_dim=hidden_dim,
        n_layers=n_layers,
        n_heads=n_heads,
        dropout=dropout,
        n_classes=n_classes
    ).to(device)

    # Set up loss function and optimizer
    print("Setting up optimizer and loss...")
    criterion = nn.CrossEntropyLoss()  # For multi-class classification
    optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate, weight_decay=1e-4)

    # Training loop
    print("Starting training loop...")
    best_acc = 0
    for epoch in range(epochs):
        model.train()  # Set model to training mode
        total_loss = 0
        for batch_features, batch_labels in train_loader:
            # Move data to the appropriate device (CPU/GPU)
            batch_features = batch_features.to(device)
            batch_labels = batch_labels.to(device)
            # Zero out gradients
            optimizer.zero_grad()
            # Forward pass
            outputs = model(batch_features)
            # Compute loss
            loss = criterion(outputs, batch_labels)
            # Check for NaN loss
            if torch.isnan(loss):
                print(f"Warning: NaN loss at epoch {epoch+1}. Stopping training.")
                return
            # Backward pass and optimization
            loss.backward()
            # Clip gradients to prevent exploding gradients
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            optimizer.step()
            total_loss += loss.item()

        # Validation phase
        model.eval()  # Set model to evaluation mode
        correct = 0
        total = 0
        with torch.no_grad():  # Disable gradient computation for efficiency
            for batch_features, batch_labels in test_loader:
                batch_features = batch_features.to(device)
                batch_labels = batch_labels.to(device)
                outputs = model(batch_features)
                _, predicted = torch.max(outputs.data, 1)  # Get predicted class
                total += batch_labels.size(0)
                correct += (predicted == batch_labels).sum().item()
        acc = 100 * correct / total  # Compute accuracy
        print(f'Epoch {epoch+1}/{epochs}, Loss: {total_loss/len(train_loader):.4f}, Accuracy: {acc:.2f}%')

        # Save the model if it achieves the best accuracy
        if acc > best_acc:
            best_acc = acc
            torch.save(model.state_dict(), 'backend/emotion_model.pth')
            print("Saved best model to backend/emotion_model.pth")

    # Save the label encoder classes
    print("Saving label encoder...")
    np.save('backend/label_encoder.npy', label_encoder.classes_)

# Entry point of the script
if __name__ == '__main__':
    try:
        print("Executing main block...")
        train_model()  # Run the training process
    except Exception as e:
        print(f"Error in main: {e}")
        traceback.print_exc()
        sys.exit(1)  # Exit with error code