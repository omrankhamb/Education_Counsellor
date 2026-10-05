import os
import logging
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGODB_URL, MONGODB_DB_NAME

logger = logging.getLogger("uvicorn.error")

_client: Optional[AsyncIOMotorClient] = None
SALT = "edu_counsellor_secure_salt_2026"

def hash_password(password: str) -> str:
    """Hash password with SHA-256 and internal salt."""
    salted = f"{SALT}:{password}:{SALT}"
    return hashlib.sha256(salted.encode("utf-8")).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Check if plaintext password matches stored hash."""
    return hash_password(password) == hashed

def get_client() -> AsyncIOMotorClient:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(
            MONGODB_URL,
            serverSelectionTimeoutMS=3000,
            connectTimeoutMS=3000
        )
    return _client

def get_db():
    return get_client()[MONGODB_DB_NAME]

def get_users_collection():
    return get_db()["users"]

def get_conversations_collection():
    return get_db()["conversations"]

def serialize_doc(doc: Dict[str, Any]) -> Dict[str, Any]:
    """Helper to convert MongoDB _id ObjectId to string id and remove sensitive fields."""
    if not doc:
        return {}
    clean = dict(doc)
    if "_id" in clean:
        clean["id"] = str(clean["_id"])
        del clean["_id"]
    if "password_hash" in clean:
        del clean["password_hash"]
    return clean

async def init_indexes():
    """Ensure indexes exist for fast lookup and uniqueness."""
    try:
        users = get_users_collection()
        await users.create_index("email", unique=True)
        convs = get_conversations_collection()
        await convs.create_index("user_id")
        logger.info("[MongoDB] Indexes initialized successfully.")
    except Exception as e:
        logger.warning(f"[MongoDB] Could not create indexes: {e}")

async def register_user(name: str, email: str, password: str, phone: Optional[str] = "") -> Dict[str, Any]:
    """Register a new student account in MongoDB."""
    email_clean = email.strip().lower()
    users = get_users_collection()
    
    existing = await users.find_one({"email": email_clean})
    if existing:
        raise ValueError("An account with this email already exists. Please log in.")
    
    user_doc = {
        "name": name.strip(),
        "email": email_clean,
        "password_hash": hash_password(password),
        "phone": phone.strip() if phone else "",
        "profile": None,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }
    
    result = await users.insert_one(user_doc)
    user_doc["_id"] = result.inserted_id
    logger.info(f"[MongoDB] Registered new user: {email_clean} ({result.inserted_id})")
    return serialize_doc(user_doc)

async def authenticate_user(email: str, password: str) -> Optional[Dict[str, Any]]:
    """Authenticate student by email and password."""
    email_clean = email.strip().lower()
    users = get_users_collection()
    
    user = await users.find_one({"email": email_clean})
    if not user:
        return None
    
    if not verify_password(password, user.get("password_hash", "")):
        return None
    
    return serialize_doc(user)

async def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve user details by user ID string."""
    try:
        users = get_users_collection()
        doc = await users.find_one({"_id": ObjectId(user_id)})
        return serialize_doc(doc) if doc else None
    except Exception as e:
        logger.error(f"[MongoDB] Error finding user {user_id}: {e}")
        return None

async def update_user_profile(user_id: str, profile_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update student academic profile details in MongoDB."""
    try:
        users = get_users_collection()
        now = datetime.utcnow().isoformat()
        
        await users.update_one(
            {"_id": ObjectId(user_id)},
            {
                "$set": {
                    "profile": profile_data,
                    "updated_at": now
                }
            }
        )
        updated = await users.find_one({"_id": ObjectId(user_id)})
        logger.info(f"[MongoDB] Updated profile for user {user_id}")
        return serialize_doc(updated) if updated else None
    except Exception as e:
        logger.error(f"[MongoDB] Error updating profile for user {user_id}: {e}")
        raise

async def save_chat_message(
    user_id: str,
    user_name: str,
    user_message: str,
    counselor_response: str
) -> bool:
    """Save user inquiry and AI counselor response to MongoDB conversations."""
    try:
        convs = get_conversations_collection()
        now = datetime.utcnow().isoformat()
        
        msg_user = {
            "role": "user",
            "content": user_message,
            "timestamp": now
        }
        msg_model = {
            "role": "model",
            "content": counselor_response,
            "timestamp": now
        }
        
        # Upsert conversation document for this user
        await convs.update_one(
            {"user_id": str(user_id)},
            {
                "$setOnInsert": {
                    "user_id": str(user_id),
                    "user_name": user_name,
                    "created_at": now
                },
                "$set": {
                    "updated_at": now
                },
                "$push": {
                    "messages": {
                        "$each": [msg_user, msg_model]
                    }
                }
            },
            upsert=True
        )
        logger.info(f"[MongoDB] Saved chat exchange for user {user_id}")
        return True
    except Exception as e:
        logger.error(f"[MongoDB] Error saving chat message: {e}")
        return False

async def get_chat_history(user_id: str) -> List[Dict[str, Any]]:
    """Retrieve chat history for a user from MongoDB."""
    try:
        convs = get_conversations_collection()
        doc = await convs.find_one({"user_id": str(user_id)})
        if doc and "messages" in doc:
            return doc["messages"]
        return []
    except Exception as e:
        logger.error(f"[MongoDB] Error getting chat history for {user_id}: {e}")
        return []

async def clear_chat_history(user_id: str) -> bool:
    """Reset chat history for a user."""
    try:
        convs = get_conversations_collection()
        await convs.delete_one({"user_id": str(user_id)})
        logger.info(f"[MongoDB] Cleared chat history for user {user_id}")
        return True
    except Exception as e:
        logger.error(f"[MongoDB] Error clearing chat history: {e}")
        return False

async def get_db_stats() -> Dict[str, Any]:
    """Get database connection health and statistics."""
    try:
        client = get_client()
        await client[MONGODB_DB_NAME].command("ping")
        users_count = await get_users_collection().count_documents({})
        convs_count = await get_conversations_collection().count_documents({})
        return {
            "connected": True,
            "database": MONGODB_DB_NAME,
            "users_count": users_count,
            "conversations_count": convs_count
        }
    except Exception as e:
        return {
            "connected": False,
            "error": str(e)
        }
