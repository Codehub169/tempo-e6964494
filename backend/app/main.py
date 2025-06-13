from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os

from app.core.config import settings
from app.db.database import engine
from app.db import models

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")

def create_db_and_tables():
    models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="A simple chatbot application with 1-on-1, group, and AI bot chats.",
    version=settings.PROJECT_VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Ensure the static directory exists and has a placeholder index.html (runs at startup)
if not os.path.exists(STATIC_DIR):
    os.makedirs(STATIC_DIR)
if not os.path.exists(os.path.join(STATIC_DIR, "index.html")):
     with open(os.path.join(STATIC_DIR, "index.html"), "w") as f:
        f.write("<!DOCTYPE html><html><head><title>ChitChat AI</title></head><body><p>Frontend is loading or not yet built. Please run startup.sh to build and serve the application.</p></body></html>")

from app.routers import auth, users, chat

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(chat.router, prefix="/api/chats", tags=["Chat"])

@app.on_event("startup")
async def startup_event():
    print("Application startup... Database initialization and other setup tasks can go here.")
    create_db_and_tables()
    print("Database tables created (if they didn't exist).")

@app.on_event("shutdown")
async def shutdown_event():
    print("Application shutdown... Cleanup tasks can go here.")

@app.get("/api/health")
async def health_check():
    return {"status": "ok", "message": "Backend is healthy"}

# Serve static files from the 'assets' subfolder (Vite's default output for JS/CSS)
VITE_ASSETS_DIR = os.path.join(STATIC_DIR, "assets")
if os.path.isdir(VITE_ASSETS_DIR):
    app.mount("/assets", StaticFiles(directory=VITE_ASSETS_DIR), name="vite_assets")
else:
    print(f"[WARNING] Vite assets directory '{VITE_ASSETS_DIR}' not found. Static assets might not be served correctly.")

# Catch-all route for SPA and other root static files (like favicon.ico)
# This must be placed AFTER all API routes and specific static mounts like /assets.
@app.get("/{full_path:path}")
async def serve_spa_or_static_file(request: Request, full_path: str):
    # Construct the potential path to a static file in the STATIC_DIR root
    static_file_path = os.path.join(STATIC_DIR, full_path)

    # Check if the requested path corresponds to an actual file in STATIC_DIR
    if os.path.isfile(static_file_path):
        return FileResponse(static_file_path)

    # If not a direct file, assume it's an SPA route and serve the main index.html
    index_html_path = os.path.join(STATIC_DIR, "index.html")
    if os.path.exists(index_html_path):
        return FileResponse(index_html_path)
    
    # Fallback if index.html itself is missing (the placeholder logic at startup should prevent this)
    raise HTTPException(status_code=404, detail="SPA entry point (index.html) or static file not found.")
