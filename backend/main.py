from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import chat, recommend
from config import APP_NAME

app = FastAPI(
    title=APP_NAME,
    description="AI-powered college recommendation system for Indian students",
    version="1.0.0"
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
    return {"status": "ok", "service": APP_NAME}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
