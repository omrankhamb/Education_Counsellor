from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from routes import chat, recommend, auth
from config import APP_NAME
import database

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize MongoDB indexes
    try:
        await database.init_indexes()
    except Exception as e:
        print(f"[Warning] DB index initialization deferred: {e}")
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
