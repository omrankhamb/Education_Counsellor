from fastapi import APIRouter, HTTPException, status
from models import RegisterRequest, LoginRequest, ProfileUpdateRequest
import database

router = APIRouter()

@router.post("/auth/register")
async def register(req: RegisterRequest):
    """Register a new student account in MongoDB."""
    if not req.email or "@" not in req.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a valid email address."
        )
    if not req.password or len(req.password) < 4:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 4 characters long."
        )
    if not req.name.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Name is required."
        )
    
    try:
        user = await database.register_user(
            name=req.name,
            email=req.email,
            password=req.password,
            phone=req.phone
        )
        return {
            "success": True,
            "message": "Account created successfully!",
            "user": user
        }
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(ve)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/auth/login")
async def login(req: LoginRequest):
    """Authenticate student with email and password from MongoDB."""
    if not req.email or not req.password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide both email and password."
        )
    
    user = await database.authenticate_user(req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please check your credentials."
        )
    
    return {
        "success": True,
        "message": "Login successful!",
        "user": user
    }

@router.post("/auth/profile")
async def update_profile(req: ProfileUpdateRequest):
    """Update student academic profile and preferences in MongoDB."""
    if not req.user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID is required."
        )
    
    try:
        updated_user = await database.update_user_profile(
            user_id=req.user_id,
            profile_data=req.profile.model_dump()
        )
        if not updated_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found."
            )
        return {
            "success": True,
            "message": "Profile saved to database successfully!",
            "user": updated_user
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not update profile: {str(e)}"
        )

@router.get("/auth/user/{user_id}")
async def get_user(user_id: str):
    """Fetch user profile and information from MongoDB."""
    user = await database.get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found."
        )
    return {"success": True, "user": user}

@router.get("/auth/stats")
async def db_stats():
    """Return MongoDB status and document counts for monitoring."""
    stats = await database.get_db_stats()
    return stats
