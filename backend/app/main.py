from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
import os

# Define the base directory for the application's static files
# __file__ is backend/app/main.py, so dirname gives backend/app/
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

app = FastAPI(
    title="ChitChat AI",
    description="A simple chatbot application with 1-on-1, group, and AI bot chats.",
    version="0.1.0"
)

# Ensure the static directory exists and has a placeholder index.html
# This helps prevent errors if the frontend hasn't been built yet when the server starts.
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)
if not os.path.exists(os.path.join(STATIC_DIR, "index.html")):
     with open(os.path.join(STATIC_DIR, "index.html"), "w") as f:
        f.write("<!DOCTYPE html><html><head><title>ChitChat AI</title></head><body><p>Frontend is loading or not yet built. Please run startup.sh to build and serve the application.</p></body></html>")

# API Routers will be added here and typically prefixed, e.g., /api
# from .routers import auth, chat
# app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
# app.include_router(chat.router, prefix="/api/chat", tags=["Chat"])

@app.on_event("startup")
async def startup_event():
    print("Application startup... Database initialization and other setup tasks can go here.")
    # Example: Database initialization
    # from .db.database import create_db_and_tables
    # create_db_and_tables()

@app.on_event("shutdown")
async def shutdown_event():
    print("Application shutdown... Cleanup tasks can go here.")

# A simple health check endpoint for the API
@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Backend is healthy"}

# Mount static files (React frontend) at the root.
# 'html=True' ensures that 'index.html' is served for directory paths (e.g., '/').
# This must be mounted *after* API routes to avoid overriding them.
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static_root")
