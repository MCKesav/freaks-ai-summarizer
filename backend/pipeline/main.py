"""
=============================================================================
STUDY MATERIAL PIPELINE - Main Application
=============================================================================
ARCHITECTURE DECISIONS:
- FastAPI for async processing
- Firebase Admin SDK for Storage & Auth verification
- Supabase client for PostgreSQL
- Firestore for ephemeral processing status only

STORAGE RULES:
- PERSIST: Raw files (Firebase Storage), Metadata (Supabase), Summaries (Supabase)
- EPHEMERAL: Extracted text (memory), Chunks (memory), Status (Firestore w/ TTL)
- NEVER: File bytes in database, redundant text copies
=============================================================================
"""

import os
import uuid
import tempfile
from datetime import datetime, timedelta
from typing import Optional
from contextlib import asynccontextmanager

# Load environment variables from project root FIRST
from dotenv import load_dotenv
project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv(os.path.join(project_root, ".env"))

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, BackgroundTasks, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Firebase
import firebase_admin
from firebase_admin import credentials, storage, firestore, auth

# Supabase
from supabase import create_client, Client

# =============================================================================
# CONFIGURATION
# =============================================================================

FIREBASE_STORAGE_BUCKET = os.getenv("FIREBASE_STORAGE_BUCKET", "freaks-ai-summarizer.firebasestorage.app")
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")  # Service key for backend operations

# Supported file types and their extractors
SUPPORTED_TYPES = {
    "application/pdf": "pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
    "image/png": "image",
    "image/jpeg": "image",
    "image/webp": "image",
    "audio/mpeg": "audio",
    "audio/wav": "audio",
    "audio/webm": "audio",
    "video/mp4": "video",
    "video/webm": "video",
}

# =============================================================================
# INITIALIZATION
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize Firebase Admin SDK on startup."""
    # Initialize Firebase Admin using service account file
    if not firebase_admin._apps:
        # Use service account JSON file - resolve path relative to this file
        current_dir = os.path.dirname(os.path.abspath(__file__))
        default_path = os.path.join(current_dir, "firebase-service-account.json")
        service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", default_path)
        cred = credentials.Certificate(service_account_path)
        firebase_admin.initialize_app(cred, {
            'storageBucket': FIREBASE_STORAGE_BUCKET
        })
    yield

app = FastAPI(
    title="Study Material Pipeline",
    description="Minimal storage backend for AI-powered study materials",
    lifespan=lifespan
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://127.0.0.1:5173", "http://127.0.0.1:5174", "http://127.0.0.1:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================================================================
# CLIENTS
# =============================================================================

def get_supabase() -> Client:
    """
    Get Supabase client for database operations.
    WHY SERVICE KEY: Backend needs to bypass RLS for file processing.
    """
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_firestore_client():
    """
    Get Firestore client for ephemeral status tracking.
    WHY FIRESTORE: Real-time updates for processing status, auto-TTL.
    """
    return firestore.client()

def get_storage_bucket():
    """Get Firebase Storage bucket."""
    return storage.bucket()

# =============================================================================
# AUTH DEPENDENCY
# =============================================================================

from fastapi import Header

async def get_firebase_user(authorization: str = Header(None)) -> dict:
    """
    FastAPI dependency to verify Firebase ID token from Authorization header.
    WHY: All operations require authenticated user.
    """
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")

# =============================================================================
# MODELS
# =============================================================================

class FileUploadResponse(BaseModel):
    file_id: str
    file_name: str
    file_type: str
    storage_path: str
    status: str

class URLUploadRequest(BaseModel):
    url: str
    title: Optional[str] = None

class TextUploadRequest(BaseModel):
    text: str
    title: Optional[str] = None

class ProcessingStatus(BaseModel):
    file_id: str
    status: str  # uploading, extracting, summarizing, complete, error
    progress: int  # 0-100
    message: Optional[str] = None

class SummaryResponse(BaseModel):
    id: str
    document_id: str
    summary_text: str
    version: int
    created_at: str

# =============================================================================
# EPHEMERAL STATUS TRACKING (FIRESTORE)
# =============================================================================

async def ensure_user_profile(firebase_uid: str, email: str = None):
    """
    Ensure user profile exists in Supabase.
    Creates a new profile if it doesn't exist, or updates email if missing.
    
    WHY: User profile should be created on first interaction,
    not just when they explicitly save settings.
    """
    supabase = get_supabase()
    
    # Check if profile exists
    result = supabase.table("users_profile").select("firebase_uid, email").eq("firebase_uid", firebase_uid).execute()
    
    if not result.data:
        # Create new profile with defaults
        supabase.table("users_profile").insert({
            "firebase_uid": firebase_uid,
            "email": email,
            "display_name": None,
            "preferences": {}
        }).execute()
    elif email and not result.data[0].get("email"):
        # Update email if profile exists but email is missing
        supabase.table("users_profile").update({
            "email": email
        }).eq("firebase_uid", firebase_uid).execute()

async def update_processing_status(
    firebase_uid: str,
    file_id: str,
    status: str,
    progress: int,
    message: str = None
):
    """
    Update processing status in Firestore.
    
    WHY FIRESTORE (not Supabase):
    - Real-time listeners for frontend updates
    - Auto-TTL for cleanup (no manual deletion needed)
    - Ephemeral by design - not the source of truth
    
    TTL: Status docs auto-delete after 24 hours
    """
    db = get_firestore_client()
    
    status_ref = db.collection("processing_status").document(file_id)
    status_ref.set({
        "firebase_uid": firebase_uid,
        "file_id": file_id,
        "status": status,
        "progress": progress,
        "message": message,
        "updated_at": firestore.SERVER_TIMESTAMP,
        # TTL: Document expires 24 hours after creation
        "expire_at": datetime.utcnow() + timedelta(hours=24)
    })

# =============================================================================
# FILE UPLOAD ENDPOINT
# =============================================================================

@app.post("/api/upload", response_model=FileUploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    background_tasks: BackgroundTasks = None,
    user: dict = Depends(get_firebase_user)
):
    """
    Upload a study material file.
    
    FLOW:
    1. Verify Firebase token → get firebase_uid
    2. Validate file type
    3. Upload to Firebase Storage (PERSIST - cheap object storage)
    4. Save metadata to Supabase (PERSIST - structured queries)
    5. Trigger background extraction & summarization
    
    STORAGE DECISIONS:
    - Raw file → Firebase Storage (source of truth, reprocessing)
    - Metadata → Supabase (queries, RLS)
    - Status → Firestore (ephemeral, real-time)
    """
    # 1. Get firebase_uid from authenticated user
    firebase_uid = user["uid"]
    user_email = user.get("email")
    
    # 1.5. Ensure user profile exists in Supabase
    await ensure_user_profile(firebase_uid, user_email)
    
    # 2. Validate file type
    content_type = file.content_type
    if content_type not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {content_type}"
        )
    
    file_type = SUPPORTED_TYPES[content_type]
    
    # 3. Generate file ID and storage path
    file_id = str(uuid.uuid4())
    file_ext = file.filename.split(".")[-1] if "." in file.filename else file_type
    storage_path = f"users/{firebase_uid}/uploads/{file_id}.{file_ext}"
    
    # 4. Update status: Uploading
    await update_processing_status(firebase_uid, file_id, "uploading", 10, "Uploading file...")
    
    try:
        # 5. Upload to Firebase Storage
        # WHY FIREBASE STORAGE: Cheap object storage, direct integration with Firebase Auth
        bucket = get_storage_bucket()
        blob = bucket.blob(storage_path)
        
        # Read file content
        content = await file.read()
        blob.upload_from_string(content, content_type=content_type)
        
        # 6. Save metadata to Supabase
        # WHY SUPABASE: Structured queries, RLS, PostgreSQL reliability
        supabase = get_supabase()
        
        metadata = {
            "file_id": file_id,
            "firebase_uid": firebase_uid,
            "file_name": file.filename,
            "file_type": file_type,
            "storage_path": storage_path,
        }
        
        supabase.table("files").insert(metadata).execute()
        
        # 6.5. Also insert into documents_metadata (for summaries foreign key)
        supabase.table("documents_metadata").insert({
            "id": file_id,
            "firebase_uid": firebase_uid
        }).execute()
        
        # 7. Update status: Upload complete
        await update_processing_status(firebase_uid, file_id, "uploaded", 25, "File uploaded successfully")
        
        # 8. Trigger background processing
        if background_tasks:
            background_tasks.add_task(
                process_file_background,
                firebase_uid=firebase_uid,
                file_id=file_id,
                storage_path=storage_path,
                file_type=file_type
            )
        
        return FileUploadResponse(
            file_id=file_id,
            file_name=file.filename,
            file_type=file_type,
            storage_path=storage_path,
            status="processing"
        )
        
    except Exception as e:
        await update_processing_status(firebase_uid, file_id, "error", 0, str(e))
        raise HTTPException(status_code=500, detail=str(e))

# =============================================================================
# URL UPLOAD ENDPOINT
# =============================================================================

@app.post("/api/upload/url", response_model=FileUploadResponse)
async def upload_url(
    request: URLUploadRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_firebase_user)
):
    """
    Process a URL as study material.
    
    WHY DIFFERENT FLOW:
    - No binary file to store in Firebase Storage
    - Jina Reader extracts content directly
    - Still save metadata for consistency
    
    STORAGE: 
    - URL stored as storage_path (no file upload needed)
    - Metadata → Supabase
    - Summary → Supabase (after extraction)
    """
    # 1. Get firebase_uid from authenticated user
    firebase_uid = user["uid"]
    user_email = user.get("email")
    
    # 1.5. Ensure user profile exists in Supabase
    await ensure_user_profile(firebase_uid, user_email)
    
    # 2. Generate file ID
    file_id = str(uuid.uuid4())
    
    # 3. Save metadata (URL as storage_path)
    supabase = get_supabase()
    
    metadata = {
        "file_id": file_id,
        "firebase_uid": firebase_uid,
        "file_name": request.title or request.url[:100],
        "file_type": "url",
        "storage_path": request.url,  # URL itself is the "path"
    }
    
    supabase.table("files").insert(metadata).execute()
    
    # 3.5. Also insert into documents_metadata (for summaries foreign key)
    supabase.table("documents_metadata").insert({
        "id": file_id,
        "firebase_uid": firebase_uid
    }).execute()
    
    # 4. Update status
    await update_processing_status(firebase_uid, file_id, "extracting", 30, "Extracting content from URL...")
    
    # 5. Trigger background processing
    background_tasks.add_task(
        process_url_background,
        firebase_uid=firebase_uid,
        file_id=file_id,
        url=request.url
    )
    
    return FileUploadResponse(
        file_id=file_id,
        file_name=request.title or request.url[:100],
        file_type="url",
        storage_path=request.url,
        status="processing"
    )

# =============================================================================
# TEXT UPLOAD ENDPOINT
# =============================================================================

@app.post("/api/upload/text", response_model=FileUploadResponse)
async def upload_text(
    request: TextUploadRequest,
    background_tasks: BackgroundTasks,
    user: dict = Depends(get_firebase_user)
):
    """
    Process raw text as study material.
    
    WHY DIFFERENT FLOW:
    - No file to upload to Firebase Storage
    - Text is directly passed to summarization
    - Minimal storage footprint
    
    STORAGE: 
    - Text stored in database (for regeneration if needed)
    - Metadata → Supabase
    - Summary → Supabase (after summarization)
    """
    # 1. Get firebase_uid from authenticated user
    firebase_uid = user["uid"]
    user_email = user.get("email")
    
    # 1.5. Ensure user profile exists in Supabase
    await ensure_user_profile(firebase_uid, user_email)
    
    # 2. Generate file ID
    file_id = str(uuid.uuid4())
    
    # 3. Generate a title from text if not provided
    text_preview = request.text[:50].strip().replace('\n', ' ')
    title = request.title or f"Text Note: {text_preview}..."
    
    # 4. Save metadata
    supabase = get_supabase()
    
    metadata = {
        "file_id": file_id,
        "firebase_uid": firebase_uid,
        "file_name": title,
        "file_type": "url",  # Reuse 'url' type since there's no 'text' enum
        "storage_path": f"text://{file_id}",  # Virtual path for text content
    }
    
    supabase.table("files").insert(metadata).execute()
    
    # 4.5. Also insert into documents_metadata (for summaries foreign key)
    supabase.table("documents_metadata").insert({
        "id": file_id,
        "firebase_uid": firebase_uid
    }).execute()
    
    # 5. Update status
    await update_processing_status(firebase_uid, file_id, "summarizing", 50, "Generating summary...")
    
    # 6. Trigger background processing
    background_tasks.add_task(
        process_text_background,
        firebase_uid=firebase_uid,
        file_id=file_id,
        text=request.text,
        title=title
    )
    
    return FileUploadResponse(
        file_id=file_id,
        file_name=title,
        file_type="url",
        storage_path=f"text://{file_id}",
        status="processing"
    )

# =============================================================================
# STATUS ENDPOINT
# =============================================================================

@app.get("/api/status/{file_id}", response_model=ProcessingStatus)
async def get_status(file_id: str, user: dict = Depends(get_firebase_user)):
    """
    Get processing status for a file.
    WHY: Frontend polling/SSE for progress updates.
    """
    firebase_uid = user["uid"]
    
    db = get_firestore_client()
    status_ref = db.collection("processing_status").document(file_id)
    status_doc = status_ref.get()
    
    if not status_doc.exists:
        raise HTTPException(status_code=404, detail="Status not found")
    
    data = status_doc.to_dict()
    
    # Verify ownership
    if data.get("firebase_uid") != firebase_uid:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return ProcessingStatus(
        file_id=file_id,
        status=data.get("status", "unknown"),
        progress=data.get("progress", 0),
        message=data.get("message")
    )

# =============================================================================
# GET MATERIALS ENDPOINT
# =============================================================================

@app.get("/api/materials")
async def get_materials(user: dict = Depends(get_firebase_user)):
    """
    Get all study materials for the authenticated user.
    Returns files with their latest summary.
    """
    firebase_uid = user["uid"]
    
    supabase = get_supabase()
    
    # Get all files for the user
    files_result = supabase.table("files")\
        .select("file_id, file_name, file_type, storage_path, upload_time")\
        .eq("firebase_uid", firebase_uid)\
        .order("upload_time", desc=True)\
        .execute()
    
    materials = []
    for file in files_result.data or []:
        # Get the latest summary for each file
        summary_result = supabase.table("summaries")\
            .select("summary_text")\
            .eq("document_id", file["file_id"])\
            .order("version", desc=True)\
            .limit(1)\
            .execute()
        
        materials.append({
            "file_id": file["file_id"],
            "file_name": file["file_name"],
            "file_type": file["file_type"],
            "storage_path": file["storage_path"],
            "upload_time": file["upload_time"],
            "has_summary": len(summary_result.data or []) > 0,
            "latest_summary": summary_result.data[0]["summary_text"] if summary_result.data else None
        })
    
    return {"materials": materials}

# =============================================================================
# GET SUMMARY ENDPOINT
# =============================================================================

@app.get("/api/summary/{file_id}", response_model=SummaryResponse)
async def get_summary(file_id: str, user: dict = Depends(get_firebase_user)):
    """
    Get the latest summary for a file.
    """
    firebase_uid = user["uid"]
    
    supabase = get_supabase()
    
    # Verify file ownership
    file_result = supabase.table("files").select("firebase_uid").eq("file_id", file_id).execute()
    
    if not file_result.data:
        raise HTTPException(status_code=404, detail="File not found")
    
    if file_result.data[0]["firebase_uid"] != firebase_uid:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Get latest summary
    summary_result = supabase.table("summaries")\
        .select("*")\
        .eq("document_id", file_id)\
        .order("version", desc=True)\
        .limit(1)\
        .execute()
    
    if not summary_result.data:
        raise HTTPException(status_code=404, detail="Summary not found")
    
    summary = summary_result.data[0]
    
    return SummaryResponse(
        id=summary["id"],
        document_id=summary["document_id"],
        summary_text=summary["summary_text"],
        version=summary["version"],
        created_at=summary["created_at"]
    )

# =============================================================================
# BACKGROUND PROCESSING (imported from extractors module)
# =============================================================================

async def process_file_background(
    firebase_uid: str,
    file_id: str,
    storage_path: str,
    file_type: str
):
    """
    Background task for file processing.
    Imported implementation from extractors module.
    """
    from extractors import process_file
    await process_file(firebase_uid, file_id, storage_path, file_type)

async def process_url_background(
    firebase_uid: str,
    file_id: str,
    url: str
):
    """
    Background task for URL processing.
    Imported implementation from extractors module.
    """
    from extractors import process_url
    await process_url(firebase_uid, file_id, url)

async def process_text_background(
    firebase_uid: str,
    file_id: str,
    text: str,
    title: str
):
    """
    Background task for text processing.
    Directly summarizes the provided text.
    """
    from extractors import process_text
    await process_text(firebase_uid, file_id, text, title)

# =============================================================================
# HEALTH CHECK
# =============================================================================

@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}

# =============================================================================
# MAIN
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)