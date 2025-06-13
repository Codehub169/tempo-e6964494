from fastapi import FastAPI, Depends
from fastapi.staticfiles import StaticFiles
import os

from backend.app.core.config import settings
from backend.app.db.database import engine #, create_db_and_tables # Import create_db_and_tables
from backend.app.db import models # Import models to ensure Base knows about them

# Define the base directory for the application's static files
# __file__ is backend/app/main.py, so dirname gives backend/app/
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

# This function should be in database.py or a similar setup file
def create_db_and_tables():
    models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A simple chatbot application with 1-on-1, group, and AI bot chats.",
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json" # if using API_V1_STR
)

# Ensure the static directory exists and has a placeholder index.html
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)
if not os.path.exists(os.path.join(STATIC_DIR, "index.html")):
     with open(os.path.join(STATIC_DIR, "index.html"), "w") as f:
        f.write("<!DOCTYPE html><html><head><title>ChitChat AI</title></head><body><p>Frontend is loading or not yet built. Please run startup.sh to build and serve the application.</p></body></html>")

# Import routers
from backend.app.routers import auth, users, chat # Adjusted import

# Include routers
# The prefix here will be prepended to all routes in the router
# e.g. if auth.router has /token, it becomes /api/auth/token
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(chat.router, prefix="/api/chats", tags=["Chat"])


@app.on_event("startup")
async def startup_event():
    print("Application startup... Database initialization and other setup tasks can go here.")
    create_db_and_tables() # Call the function to create tables
    print("Database tables created (if they didn't exist).")

@app.on_event("shutdown")
async def shutdown_event():
    print("Application shutdown... Cleanup tasks can go here.")

# A simple health check endpoint for the API
@app.get("/api/health") # Keep this as /api/health as it might be used by deployment services
async def health_check():
    return {"status": "ok", "message": "Backend is healthy"}

# Mount static files (React frontend) at the root.
# This must be mounted *after* API routes to avoid overriding them.
app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static_root")
