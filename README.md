# JoyVerse / VemoraPulse 🌟
### Emotion-Aware Intelligent Learning Platform for Children with Dyslexia

**JoyVerse (VemoraPulse)** is a web-based intelligent learning platform specifically designed to support children with dyslexia. It integrates real-time facial expression detection using **Face Mesh technology** and a custom **Emotion Transformer model** to adapt the learning environment dynamically, ensuring an engaging and emotionally supportive experience.

---

## 🏗️ System Architecture

The project follows a modern distributed architecture:

1.  **Frontend (React + Vite):** Captures webcam feed, extracts facial landmarks using MediaPipe, and renders the game UI.
2.  **Middleware (Node.js + Express):** Handles user authentication, manages the MongoDB database, and routes landmark data to the AI service.
3.  **AI Service (Flask + PyTorch):** Processes facial landmarks through a Transformer-based neural network to predict emotional states.
4.  **Database (MongoDB):** Stores profiles for SuperAdmins, Admins (therapists/parents), and Children, along with game reports and emotion trends.

---

## 🚀 Getting Started

### 1. AI Model Setup (Flask)
The AI service handles emotion inference.
```bash
cd AImodel
# Install dependencies (torch, flask, flask-cors, numpy, pandas, scikit-learn)
python app.py
```
*   **Port:** 5000
*   **Model:** Emotion Transformer (1404 input dimensions -> 6 classes)
*   **Training:** To retrain, run `python train.py`. Model weights are saved in `AImodel/backend/`.

### 2. Backend Setup (Express)
The central server for data and auth.
```bash
cd backend
npm install
npm start
```
*   **Port:** 3000
*   **Database:** Ensure MongoDB is running and connected via `MONGO_URI` in `.env`.

### 3. Frontend Setup (Vite/React)
The user interface.
```bash
cd frontend
npm install
npm run dev
```
*   **Port:** 5173

---

## 🧠 AI & Dataset Details

### Dataset
*   **Source:** Custom dataset `JoyVerseDataSet_Filled.xlsx` located in the `AImodel` directory.
*   **Features:** 468 facial landmarks (x, y, z coordinates) extracted via MediaPipe FaceMesh.
*   **Preprocessing:** The landmarks are flattened into a 1404-dimensional vector, normalized using calculated mean and standard deviation.

### Model Training
The model is a **Transformer Encoder** optimized for landmark-based emotion recognition.
*   **Architecture:** 
    *   Linear Input Projection (1404 -> 128)
    *   Transformer Encoder Layer (8 attention heads)
    *   Dropout Regularization (0.3)
    *   Fully Connected Classification Layer
*   **Emotion Classes:** `Happy`, `Sad`, `Angry`, `Fear`, `Disgust`, `Neutral`.

---

## 🎮 Features & Interfaces

### 1. Child Interface
*   **Word Unscramble Game:** Interactive drag-and-drop word puzzles with animal themes.
*   **Emotional Adaptation:** UI background colors shift based on detected emotions (e.g., soft purple for happy, warm peach for sad).
*   **Positive Reinforcement:** Displays specific motivational media (like GIFs or videos) tailored to the child's current emotional state.

### 2. Admin (Therapist/Parent) Interface
*   **Dashboard:** View all registered children and their performance metrics.
*   **Detailed Analytics:** Access game-by-game reports and emotion trend charts (Happy/Sad/Neutral distributions).
*   **Management:** Complete CRUD operations for child accounts and password resets.

### 3. SuperAdmin Interface
*   **Admin Management:** Create and monitor Admin (therapist) accounts with toggleable activation status.

---

## 📂 Project Structure

```text
JOY_VERSE_FACEMESH/
├── AImodel/                # Python/Flask AI Service
│   ├── app.py              # Flask Inference Server
│   ├── train.py            # Model Training Script
│   ├── backend/            # Saved model weights (.pth) & normalization files
│   └── JoyVerseDataSet_Filled.xlsx # Custom Dataset
├── backend/                # Node.js/Express Server
│   ├── models/             # Mongoose Schemas (Admin, Child, SuperAdmin)
│   ├── routes/             # API Endpoints (admin, child, superadmin)
│   └── server.js           # Express Entry point & Socket.io setup
├── frontend/               # Vite/React Frontend
│   ├── src/
│   │   ├── components/     # Role-specific dashboards & Game logic
│   │   ├── styles/         # Vanilla CSS modules for each interface
│   │   └── utils/          # API services & JWT Auth management
│   └── index.html
└── README.md               # Project Documentation
```

---

## 🛠️ Tech Stack
*   **Frontend:** React, Vite, MediaPipe FaceMesh, Socket.io-client, Axios, Chart.js.
*   **Backend:** Node.js, Express, MongoDB, Mongoose, Socket.io, Multer (for profile photos).
*   **AI/ML:** Python, PyTorch (Transformers), Flask, NumPy, Scikit-learn.

---
*Bridging the gap between Artificial Intelligence and Inclusive Education.*
