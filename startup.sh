#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "--- Starting ChitChat AI Application Setup ---"

# Navigate to the script's directory to ensure relative paths work
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# Backend setup
echo "[Backend] Setting up Python virtual environment and installing dependencies..."
cd backend
if [ -d "venv" ]; then
    echo "[Backend] Virtual environment 'venv' already exists. Re-using it."
else
    python3 -m venv venv
    echo "[Backend] Created Python virtual environment."
fi

# Activate virtual environment for subsequent pip command (though explicit path is used for uvicorn later)
source venv/bin/activate
pip install -r requirements.txt
deactivate # Deactivate after installing dependencies
echo "[Backend] Dependencies installed."
cd .. # Back to project root

# Frontend setup
echo "[Frontend] Setting up Node.js dependencies and building application..."
cd frontend

# Check for npm
if ! command -v npm &> /dev/null
then
    echo "[Frontend] ERROR: npm is not installed. Please install Node.js and npm."
    exit 1
fi

npm install
echo "[Frontend] Node modules installed."
npm run build # This command must be defined in frontend/package.json
              # and output to a 'build' (or 'dist') directory.
echo "[Frontend] Build complete."
cd .. # Back to project root

# Prepare static files for FastAPI
echo "[Deployment] Preparing frontend static files for backend..."
BACKEND_STATIC_DIR="backend/app/static"
FRONTEND_BUILD_DIR="frontend/build" # Assuming React build output is here

# Check if frontend build directory exists
if [ ! -d "$FRONTEND_BUILD_DIR" ]; then
    echo "[Deployment] ERROR: Frontend build directory ($FRONTEND_BUILD_DIR) not found."
    echo "Please ensure 'npm run build' in the 'frontend' directory creates this folder."
    exit 1
fi

# Remove old static directory in backend to ensure a clean copy
if [ -d "$BACKEND_STATIC_DIR" ]; then
    rm -rf "$BACKEND_STATIC_DIR"
    echo "[Deployment] Removed old static files directory: $BACKEND_STATIC_DIR"
fi
mkdir -p "$BACKEND_STATIC_DIR"
echo "[Deployment] Created static files directory: $BACKEND_STATIC_DIR"

# Copy frontend build to backend static folder
cp -r "$FRONTEND_BUILD_DIR"/* "$BACKEND_STATIC_DIR"/
echo "[Deployment] Copied frontend build artifacts to $BACKEND_STATIC_DIR."

echo "--- Application Setup Complete ---"

# Run backend server
echo "--- Starting Backend Server (FastAPI with Uvicorn) --- "
echo "Application will be available at http://localhost:9000"
cd backend
# Use the uvicorn executable from the virtual environment
"venv/bin/uvicorn" app.main:app --host 0.0.0.0 --port 9000 --reload
# For production, consider removing --reload
