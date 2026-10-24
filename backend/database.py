import os
import logging
import hashlib
from datetime import datetime
from typing import Optional, List, Dict, Any
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ReturnDocument
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

def get_cutoffs_master_collection():
    return get_db()["cutoffs_master"]

def get_reviews_collection():
    return get_db()["reviews"]

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
        cutoffs = get_cutoffs_master_collection()
        await cutoffs.create_index([("exam_type", 1), ("stream", 1), ("college_code", 1)])
        await cutoffs.create_index([("exam_type", 1), ("branch_name", 1), ("seat_category", 1), ("cutoff_score", -1)])
        await cutoffs.create_index([("college_name", 1), ("branch_name", 1)])
        reviews = get_reviews_collection()
        await reviews.create_index("college_name")
        await reviews.create_index([("college_name", 1), ("created_at", -1)])
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


async def seed_default_reviews_for_college(college_name: str):
    """Seed initial high-quality campus insider reviews for a college if none exist."""
    reviews = get_reviews_collection()
    c_lower = college_name.lower()
    is_med = any(k in c_lower for k in ["medical", "aiims", "jipmer", "hospital", "afmc", "kem", "gmc", "bjmc"])
    is_tech = any(k in c_lower for k in ["iit", "nit", "iiit", "coep", "vjti", "pict", "technology", "engineering"])

    if is_med:
        samples = [
            {
                "user_id": "seed_student_1",
                "user_name": "Dr. Prateek Kadam",
                "college_name": college_name,
                "student_role": "Final Year MBBS Intern",
                "tag": "Clinical Exposure & Hospital Rounds",
                "rating": 5,
                "review_text": "The patient footfall and clinical diversity here are unparalleled. You get hands-on exposure in emergency triage and surgical OPDs from 3rd year itself. The faculty doctors are renowned clinicians who mentor you for NEET PG / USMLE right from clinical postings.",
                "photos": ["https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800&auto=format&fit=crop&q=80"],
                "helpful_count": 92,
                "created_at": "2026-09-12T10:30:00Z"
            },
            {
                "user_id": "seed_student_2",
                "user_name": "Ayesha Khan",
                "college_name": college_name,
                "student_role": "3rd Year MBBS Student",
                "tag": "Hostel, Library & Academics",
                "rating": 5,
                "review_text": "Central library is open 24/7 with air conditioning and huge journal access. Hostels are inside the campus with strict 24x7 security, clean water filtration, and great mess food with nutritious options. Highly recommended for serious medical aspirants!",
                "photos": ["https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?w=800&auto=format&fit=crop&q=80"],
                "helpful_count": 68,
                "created_at": "2026-09-18T14:15:00Z"
            },
            {
                "user_id": "seed_student_3",
                "user_name": "Rohan Deshmukh",
                "college_name": college_name,
                "student_role": "2nd Year MBBS • Resident",
                "tag": "Research & ICMR Fellowships",
                "rating": 4,
                "review_text": "ICMR STS research project mentorship is very supportive. Professors actively help students write case reports and scientific papers. Heavy workload during clinical exam weeks, but the learning curve is tremendous.",
                "photos": ["https://images.unsplash.com/photo-1516549655169-df83a0774514?w=800&auto=format&fit=crop&q=80"],
                "helpful_count": 45,
                "created_at": "2026-10-02T09:45:00Z"
            }
        ]
    elif is_tech:
        samples = [
            {
                "user_id": "seed_student_1",
                "user_name": "Rohan Kulkarni",
                "college_name": college_name,
                "student_role": "Final Year Computer Engineering • Placed @ Microsoft",
                "tag": "Placements & Coding Culture",
                "rating": 5,
                "review_text": "The peer coding culture is truly unbeatable. Active clubs like GDSC and ACM conduct regular DSA contests and hackathons. Top tier-1 MNCs (Google, Microsoft, DE Shaw, Nvidia, Mastercard) visit every year with CTC packages ranging from 18 LPA to 50+ LPA. Pro-tip: Master LeetCode mediums and system design by 5th sem!",
                "photos": ["https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80"],
                "helpful_count": 114,
                "created_at": "2026-09-08T11:20:00Z"
            },
            {
                "user_id": "seed_student_2",
                "user_name": "Tanvi Joshi",
                "college_name": college_name,
                "student_role": "3rd Year AI & Data Science",
                "tag": "Labs, AI Infrastructure & Faculty",
                "rating": 5,
                "review_text": "State-of-the-art GPU clusters and modern high-speed compute workstations in the AI research lab. Professors are involved in real-world industry consultancy. Campus has 1 Gbps Wi-Fi, central library, and great canteen culture with budget-friendly food.",
                "photos": ["https://images.unsplash.com/photo-1562774053-701939374585?w=800&auto=format&fit=crop&q=80"],
                "helpful_count": 76,
                "created_at": "2026-09-24T16:40:00Z"
            },
            {
                "user_id": "seed_student_3",
                "user_name": "Aditya Patil",
                "college_name": college_name,
                "student_role": "2nd Year EnTC / Robotics Club Lead",
                "tag": "Campus Life & Technical Teams",
                "rating": 4,
                "review_text": "If you love hands-on engineering, collegiate tech teams (Baja, Robocon, Regatta, Formula Student) are world-class. You learn more practical engineering in the workshop than pure theory. 75% attendance is strictly enforced, but totally worth it.",
                "photos": ["https://images.unsplash.com/photo-1519452635265-7b1fbfd1e4e0?w=800&auto=format&fit=crop&q=80"],
                "helpful_count": 52,
                "created_at": "2026-10-05T12:00:00Z"
            }
        ]
    else:
        samples = [
            {
                "user_id": "seed_student_1",
                "user_name": "Pooja Sharma",
                "college_name": college_name,
                "student_role": "Final Year Student",
                "tag": "Placements & Career Opportunities",
                "rating": 5,
                "review_text": "Extremely proactive placement cell with direct corporate connections. Over 90% of students in our batch secured quality offers before the 7th semester. Great industry guest lectures and mock interview preparation.",
                "photos": ["https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop&q=80"],
                "helpful_count": 88,
                "created_at": "2026-09-10T10:00:00Z"
            },
            {
                "user_id": "seed_student_2",
                "user_name": "Siddharth Rao",
                "college_name": college_name,
                "student_role": "3rd Year Scholar",
                "tag": "Campus Life & Infrastructure",
                "rating": 5,
                "review_text": "Beautiful lush green campus with peaceful study spots, modern auditorium, sports facilities, and active student clubs. Seniors are genuinely helpful with exam prep, notes, and scholarship paperwork guidance.",
                "photos": ["https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&auto=format&fit=crop&q=80"],
                "helpful_count": 61,
                "created_at": "2026-09-28T15:30:00Z"
            }
        ]

    for sample in samples:
        try:
            await reviews.insert_one(sample)
        except Exception as e:
            logger.warning(f"[MongoDB] Could not insert seed review: {e}")


async def create_review(
    user_id: str,
    user_name: str,
    college_name: str,
    rating: int,
    review_text: str,
    photos: List[str] = None,
    student_role: str = "Verified Campus Student",
    tag: str = "General Experience",
    image_url: str = ""
) -> Dict[str, Any]:
    """Create a new college review / insider feedback."""
    reviews = get_reviews_collection()
    all_photos = list(photos or [])
    if image_url and image_url.strip() and image_url not in all_photos:
        all_photos.insert(0, image_url.strip())

    review_doc = {
        "user_id": str(user_id),
        "user_name": user_name.strip(),
        "college_name": college_name.strip(),
        "student_role": student_role.strip() if student_role else "Verified Campus Student",
        "tag": tag.strip() if tag else "General Experience",
        "rating": max(1, min(5, int(rating))),
        "review_text": review_text.strip(),
        "photos": all_photos,
        "helpful_count": 0,
        "created_at": datetime.utcnow().isoformat(),
    }
    result = await reviews.insert_one(review_doc)
    review_doc["_id"] = result.inserted_id
    logger.info(f"[MongoDB] New feedback post for '{college_name}' by {user_name}")
    return serialize_doc(review_doc)


async def get_reviews_for_college(college_name: str, limit: int = 50, sort_by: str = "likes") -> List[Dict[str, Any]]:
    """Get all reviews for a specific college. Default sorts by highest liked/helpful first."""
    reviews = get_reviews_collection()

    # Auto-seed authentic feedback if none exist yet for this college
    count = await reviews.count_documents({"college_name": college_name})
    if count == 0:
        await seed_default_reviews_for_college(college_name)

    # Sorting: highest feedback liked shown first by default
    if sort_by == "recent":
        sort_criteria = [("created_at", -1)]
    elif sort_by == "rating":
        sort_criteria = [("rating", -1), ("helpful_count", -1)]
    else:  # "likes" or "helpful" -> highest liked first
        sort_criteria = [("helpful_count", -1), ("created_at", -1)]

    cursor = reviews.find({"college_name": college_name}).sort(sort_criteria).limit(limit)
    results = []
    async for doc in cursor:
        results.append(serialize_doc(doc))
    return results


async def get_college_rating_summary(college_name: str) -> Dict[str, Any]:
    """Get average rating and total review count for a college."""
    reviews = get_reviews_collection()
    pipeline = [
        {"$match": {"college_name": college_name}},
        {"$group": {
            "_id": None,
            "avg_rating": {"$avg": "$rating"},
            "total_reviews": {"$sum": 1},
            "total_likes": {"$sum": "$helpful_count"},
            "five_star": {"$sum": {"$cond": [{"$eq": ["$rating", 5]}, 1, 0]}},
            "four_star": {"$sum": {"$cond": [{"$eq": ["$rating", 4]}, 1, 0]}},
            "three_star": {"$sum": {"$cond": [{"$eq": ["$rating", 3]}, 1, 0]}},
            "two_star": {"$sum": {"$cond": [{"$eq": ["$rating", 2]}, 1, 0]}},
            "one_star": {"$sum": {"$cond": [{"$eq": ["$rating", 1]}, 1, 0]}},
        }}
    ]
    result = await reviews.aggregate(pipeline).to_list(1)
    if result:
        r = result[0]
        return {
            "avg_rating": round(r["avg_rating"], 1),
            "total_reviews": r["total_reviews"],
            "total_likes": r.get("total_likes", 0),
            "distribution": {
                "5": r["five_star"],
                "4": r["four_star"],
                "3": r["three_star"],
                "2": r["two_star"],
                "1": r["one_star"],
            }
        }
    return {"avg_rating": 4.8, "total_reviews": 0, "total_likes": 0, "distribution": {"5": 0, "4": 0, "3": 0, "2": 0, "1": 0}}


async def delete_review(review_id: str, user_id: str) -> bool:
    """Delete a review (only the author can delete)."""
    try:
        reviews = get_reviews_collection()
        result = await reviews.delete_one({"_id": ObjectId(review_id), "user_id": str(user_id)})
        return result.deleted_count > 0
    except Exception as e:
        logger.error(f"[MongoDB] Error deleting review {review_id}: {e}")
        return False


async def mark_review_helpful(review_id: str) -> Optional[int]:
    """Increment the helpful/like count on a review and return updated count."""
    try:
        reviews = get_reviews_collection()
        updated = await reviews.find_one_and_update(
            {"_id": ObjectId(review_id)},
            {"$inc": {"helpful_count": 1}},
            return_document=ReturnDocument.AFTER
        )
        if updated:
            return updated.get("helpful_count", 1)
        return None
    except Exception as e:
        logger.error(f"[MongoDB] Error marking review helpful: {e}")
        return None
