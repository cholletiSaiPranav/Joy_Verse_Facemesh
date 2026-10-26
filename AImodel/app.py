# Import required libraries
from flask import Flask, request, jsonify  # Flask for web server, request handling, and JSON responses
from flask_cors import CORS  # Enable Cross-Origin Resource Sharing
import numpy as np  # For numerical operations and array handling
import torch  # PyTorch for model inference
import torch.nn as nn  # Neural network modules
from train import EmotionTransformer  # Import the EmotionTransformer model class from train.py

# Initialize Flask application
app = Flask(__name__)
# Enable CORS to allow requests from different origins (e.g., React frontend)
CORS(app)

# Set device for model inference (GPU if available, else CPU)
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

# Initialize the EmotionTransformer model with specified hyperparameters
model = EmotionTransformer(
    input_dim=468 * 3,  # Input size: 468 facial landmarks * 3 coordinates (x, y, z)
    hidden_dim=128,     # Hidden layer size (matches train.py)
    n_layers=1,         # Number of transformer layers (matches train.py)
    n_heads=8,          # Number of attention heads
    dropout=0.3,        # Dropout rate for regularization
    n_classes=6         # Number of emotion classes (Angry, Disgust, Fear, Happy, Neutral, Sad)
)

# Load the pre-trained model weights
try:
    # Load model state dictionary from file, mapping to the appropriate device
    model.load_state_dict(torch.load('backend/emotion_model.pth', map_location=device))
    # Set model to evaluation mode (disables dropout and batch normalization)
    model.eval()
    # Move model to the specified device (CPU/GPU)
    model.to(device)
    print(f"✅ Model loaded successfully from: backend/emotion_model.pth")
except Exception as e:
    # Log error if model loading fails and set model to None to prevent predictions
    print(f"❌ Error loading model: {e}")
    model = None

# Load label encoder and normalization parameters
try:
    # Load label encoder classes (emotion names) from file
    label_encoder = np.load('backend/label_encoder.npy', allow_pickle=True)
    # Load mean and standard deviation for feature normalization
    mean = np.load('backend/mean.npy', allow_pickle=True)
    std = np.load('backend/std.npy', allow_pickle=True)
    print(f"Label encoder loaded: {list(label_encoder)}")
except Exception as e:
    # Log error if loading fails and set variables to None
    print(f"Error loading label encoder or stats: {e}")
    label_encoder, mean, std = None, None, None

# Define the /detect_emotion endpoint to handle emotion prediction requests
@app.route('/detect_emotion', methods=['POST'])
def predict_emotion():
    # Check if model or label encoder failed to load
    if model is None or label_encoder is None:
        return jsonify({'error': 'Model or label encoder not loaded'}), 500

    # Get JSON data from the request
    data = request.get_json()
    # Extract landmarks from the request data (expected to be a list of 468 * 3 values)
    landmarks = data.get('landmarks', [])
    print(f"Received landmarks length: {len(landmarks)}")

    # Validate the landmarks data
    if not landmarks or len(landmarks) != 468 * 3:
        return jsonify({'error': f'Invalid landmarks: expected {468*3}, got {len(landmarks)}'}), 400

    try:
        # Convert landmarks to a NumPy array with float32 dtype
        features = np.array(landmarks, dtype=np.float32)
        # Normalize features using saved mean and standard deviation
        if mean is not None and std is not None:
            features = (features - mean) / std
        # Convert features to a PyTorch tensor, add batch dimension, and move to device
        features_tensor = torch.FloatTensor(features).unsqueeze(0).to(device)
    except Exception as e:
        # Log error if feature processing fails and return error response
        print(f"Error processing landmarks: {e}")
        return jsonify({'error': 'Error processing landmarks'}), 400

    try:
        # Perform inference without gradient computation
        with torch.no_grad():
            # Get model output (logits)
            output = model(features_tensor)
            # Apply softmax to convert logits to probabilities
            probabilities = torch.softmax(output, dim=1).cpu().numpy()[0]
            # Get the index of the predicted class
            predicted_idx = torch.max(output, 1)[1].item()
            # Map index to emotion label
            emotion = label_encoder[predicted_idx]
            # Create a dictionary of emotion probabilities
            prob_dict = {label_encoder[i]: float(prob) for i, prob in enumerate(probabilities)}
            # Log the prediction for debugging
            print(f"Predicted emotion: {emotion}, Probabilities: {prob_dict}")
            # Return the predicted emotion and probabilities as JSON
            return jsonify({'emotion': emotion, 'probabilities': prob_dict})
    except Exception as e:
        # Log error if prediction fails and return error response
        print(f"🔥 Error during prediction: {e}")
        return jsonify({'error': 'Prediction failed'}), 500

# Run the Flask server
if __name__ == '__main__':
    app.run(debug=True, port=5000)  # Run in debug mode on port 5000