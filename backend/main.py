import os
import asyncio
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routes import chat, recommend, auth, reviews, documents
from config import APP_NAME
import database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize MongoDB indexes & real college image cache
    try:
        await database.init_indexes()
    except Exception as e:
        print(f"[Warning] DB index initialization deferred: {e}")
    try:
        from services.college_image_service import preload_all_verified_images
        asyncio.create_task(asyncio.to_thread(preload_all_verified_images))
    except Exception as e:
        print(f"[Warning] College image preload deferred: {e}")
    yield
    # Shutdown
    client = database._client
    if client:
        client.close()

app = FastAPI(
    title=APP_NAME,
    description="AI-powered college recommendation system for Indian students with MongoDB persistence",
    version="1.0.0",
    lifespan=lifespan
)

# Allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routes
app.include_router(auth.router, prefix="/api", tags=["Authentication & Profile"])
app.include_router(chat.router, prefix="/api", tags=["AI Chat"])
app.include_router(recommend.router, prefix="/api", tags=["Recommendations"])
app.include_router(reviews.router, prefix="/api", tags=["College Reviews"])
app.include_router(documents.router, prefix="/api", tags=["Live Document Verifier & Proformas"])

# Serve uploaded review photos as static files
app.mount("/api/review-photos", StaticFiles(directory=os.path.join(os.path.dirname(__file__), "review_uploads")), name="review-photos")

# Serve real college campus images downloaded from internet
COLLEGE_IMG_DIR = os.path.join(os.path.dirname(__file__), "college_images")
os.makedirs(COLLEGE_IMG_DIR, exist_ok=True)
app.mount("/api/college-images", StaticFiles(directory=COLLEGE_IMG_DIR), name="college-images")

@app.get("/")
async def root():
    return {
        "message": f"Welcome to {APP_NAME} API",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/api/health")
async def health_check():
    db_stats = await database.get_db_stats()
    return {
        "status": "ok",
        "service": APP_NAME,
        "database": db_stats
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
