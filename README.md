# MEDX - Smart Hospital Triage & Recommendation Engine

MEDX is an AI-powered healthcare triage and hospital recommendation platform. It uses natural language processing to analyze patient symptoms, classify the severity, and recommend the best nearby hospitals based on real-time travel times, facility capabilities, and hospital specialization.

## 🚀 Features

*   **AI Symptom Analysis:** Uses the Groq LLM API (`llama-3.1-8b-instant`) to instantly process patient symptoms, categorizing them by medical department (Cardiology, Orthopedics, etc.) and severity (Mild, Moderate, Severe).
*   **Smart Recommendations:** A robust recommendation engine that ranks hospitals based on distance, travel time, available ICU beds, ratings, and doctor availability.
*   **Live Interactive Maps:** Integrated Leaflet & OpenStreetMap for beautiful, dynamic map views that plot the fastest route from the user to the recommended hospital.
*   **Real-time Routing:** Leverages the OSRM (Open Source Routing Machine) API to fetch live driving distances and ETAs in parallel for blazing-fast performance.
*   **Modern UI:** A sleek, responsive dark-themed React interface built with Material-UI (MUI) and scalable `react-icons`.

## 🛠️ Tech Stack

**Backend**
*   **Framework:** FastAPI (Python)
*   **Database:** SQLite + SQLAlchemy
*   **AI/LLM:** Groq API (Llama 3.1)
*   **Routing:** OSRM & Overpass API
*   **Machine Learning:** Scikit-learn (Joblib model for feature extraction & classification)

**Frontend**
*   **Framework:** React + Vite
*   **UI Library:** Material-UI (MUI)
*   **Icons:** React Icons
*   **Mapping:** React-Leaflet + Leaflet

## ⚙️ Setup Instructions

### 1. Backend Setup

Open a terminal and navigate to the root directory, then:

```bash
# Move into the backend directory
cd backend

# Create a virtual environment (recommended)
python -m venv .venv
source .venv/bin/activate  # On Windows use: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure your environment variables
# Edit the .env file and add your GROQ_API_KEY
# GROQ_MODEL is pre-configured to llama-3.1-8b-instant

# (Optional) Seed the database with synthetic hospital data
python seed_hospitals.py

# Start the FastAPI server
uvicorn main:app --reload
```
*The backend will run on http://localhost:8000*

### 2. Frontend Setup

Open a new terminal and navigate to the frontend directory:

```bash
# Move into the frontend directory
cd opd-frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```
*The frontend will be available at http://localhost:5173*

## 💡 How it Works

1.  **Patient Input:** The user types their symptoms or selects a quick-start card (e.g., "Chest pain").
2.  **LLM Triage:** The backend sends the text to Groq. The LLM extracts the context, identifies the likely medical department, and assigns a severity level.
3.  **Proximity Search:** The system uses Overpass/OSM to locate nearby hospitals and OSRM to calculate real-world travel times in parallel.
4.  **Scoring & Ranking:** The recommendation engine scores the nearest hospitals using either a weighted heuristic or a pre-trained ML classifier (`hospital_classifier.pkl`), taking into account wait times, beds, and specialist matches.
5.  **Visualization:** The React frontend displays the top matches alongside an interactive Leaflet map tracing the optimal route to the #1 recommended facility.