"""
=============================================================================
TEXT EXTRACTORS - Extract text from various file formats
=============================================================================
EXTRACTION TOOLS (as mandated):
- PDF → PyMuPDF (fitz)
- DOCX/PPT → Apache Tika
- Image OCR → Tesseract
- Audio → Whisper
- Video → FFmpeg + Whisper
- URL → Jina Reader

STORAGE DECISIONS:
- Extracted text is EPHEMERAL (kept in memory only)
- NEVER persist raw extracted text to database
- Text is passed directly to summarizer, then discarded

WHY NOT PERSIST EXTRACTED TEXT:
- Can be cheaply re-extracted from source file
- Source file is the truth (already stored in Firebase Storage)
- Saves significant storage costs
- Avoids data duplication
=============================================================================
"""

import os
import tempfile
import subprocess
from typing import Optional
import httpx

# Firebase
from firebase_admin import storage, firestore
from datetime import datetime, timedelta

# Supabase
from supabase import create_client

# Extraction libraries
import fitz  # PyMuPDF for PDF
import requests  # For Tika REST API
import threading
import time
import pytesseract  # Tesseract for OCR
from PIL import Image
import whisper  # OpenAI Whisper for audio/video

# Performance optimization: parallelization
from concurrent.futures import ThreadPoolExecutor, as_completed
import asyncio

# Environment
from dotenv import load_dotenv
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
JINA_API_KEY = os.getenv("JINA_READER_API_KEY")
LLAMA_API_URL = os.getenv("LLAMA_API_URL", "http://localhost:11434/api/generate")

# Initialize Whisper model (load once, reuse)
# WHY base model: Balance between accuracy and speed for study materials
_whisper_model = None

def get_whisper_model():
    """Lazy load Whisper model to avoid startup delay."""
    global _whisper_model
    if _whisper_model is None:
        _whisper_model = whisper.load_model("base")
    return _whisper_model

# =============================================================================
# APACHE TIKA SERVER MANAGEMENT
# =============================================================================

class TikaServer:
    """Manages Apache Tika server for document extraction."""
    
    def __init__(self, port=9998, version="2.9.1"):
        self.port = port
        self.version = version
        self.url = f"http://localhost:{port}"
        # Store JAR in backend/pipeline directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        self.jar_path = os.path.join(current_dir, f"tika-server-standard-{version}.jar")
        self.process = None
        self.running = False
        # Use JAVA_PATH from env or fall back to system java
        self.java_path = os.getenv("JAVA_PATH", "java")
        
    def download_tika(self):
        """Download Tika server JAR if not exists."""
        if os.path.exists(self.jar_path):
            return
            
        print(f"Downloading Apache Tika {self.version}...")
        download_url = f"https://archive.apache.org/dist/tika/2.9.1/tika-server-standard-{self.version}.jar"
        
        try:
            response = requests.get(download_url, stream=True)
            response.raise_for_status()
            
            with open(self.jar_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print(f"Downloaded {self.jar_path}")
        except Exception as e:
            print(f"Failed to download Tika: {e}")
            raise
    
    def start_server(self):
        """Start Tika server in background."""
        if self.running:
            return
            
        self.download_tika()
        
        try:
            # Check if server is already running
            response = requests.get(f"{self.url}/tika", timeout=2)
            if response.status_code == 200:
                self.running = True
                return
        except:
            pass
        
        # Start new server using configured Java path
        print(f"Starting Tika server on port {self.port} using {self.java_path}...")
        self.process = subprocess.Popen([
            self.java_path, "-jar", self.jar_path, "--port", str(self.port)
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        
        # Wait for server to start
        for _ in range(30):  # 30 second timeout
            try:
                response = requests.get(f"{self.url}/tika", timeout=1)
                if response.status_code == 200:
                    self.running = True
                    print(f"Tika server started on {self.url}")
                    return
            except:
                time.sleep(1)
        
        raise Exception("Tika server failed to start")
    
    def extract_text(self, file_bytes: bytes, content_type: str = "application/octet-stream") -> str:
        """Extract text using Tika server."""
        if not self.running:
            self.start_server()
        
        try:
            headers = {
                'Content-Type': content_type,
                'Accept': 'text/plain'
            }
            response = requests.put(f"{self.url}/tika", data=file_bytes, headers=headers, timeout=30)
            response.raise_for_status()
            return response.text.strip()
        except Exception as e:
            print(f"Tika extraction failed: {e}")
            return ""
    
    def stop_server(self):
        """Stop Tika server."""
        if self.process:
            self.process.terminate()
            self.process.wait()
        self.running = False

# Global Tika server instance
_tika_server = TikaServer()

def get_tika_server():
    """Get shared Tika server instance."""
    return _tika_server

# =============================================================================
# HELPER FUNCTIONS
# =============================================================================

def get_supabase():
    """Get Supabase client."""
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_firestore_client():
    """Get Firestore client."""
    return firestore.client()

async def update_status(firebase_uid: str, file_id: str, status: str, progress: int, message: str = None):
    """Update processing status in Firestore (ephemeral)."""
    db = get_firestore_client()
    status_ref = db.collection("processing_status").document(file_id)
    status_ref.set({
        "firebase_uid": firebase_uid,
        "file_id": file_id,
        "status": status,
        "progress": progress,
        "message": message,
        "updated_at": firestore.SERVER_TIMESTAMP,
        "expire_at": datetime.utcnow() + timedelta(hours=24)
    })

def download_from_storage(storage_path: str) -> bytes:
    """
    Download file from Firebase Storage.
    WHY: Need file bytes for extraction, but don't persist them.
    """
    bucket = storage.bucket()
    blob = bucket.blob(storage_path)
    return blob.download_as_bytes()

# =============================================================================
# PDF EXTRACTION (PyMuPDF)
# =============================================================================

def extract_pdf(file_bytes: bytes) -> str:
    """
    Extract text from PDF using PyMuPDF.
    
    WHY PyMuPDF:
    - Fast and memory efficient
    - Good text extraction quality
    - Handles most PDF formats
    
    RETURNS: Extracted text (EPHEMERAL - not persisted)
    """
    text_parts = []
    
    # Open PDF from bytes (no temp file needed)
    with fitz.open(stream=file_bytes, filetype="pdf") as doc:
        for page_num, page in enumerate(doc):
            # Extract text from page
            page_text = page.get_text("text")
            if page_text.strip():
                text_parts.append(page_text)
    
    # Return combined text
    # WHY join with newlines: Preserve document structure for LLM
    return "\n\n".join(text_parts)

# =============================================================================
# DOCX/PPTX EXTRACTION (Apache Tika)
# =============================================================================

def extract_tika(file_bytes: bytes, file_ext: str) -> str:
    """
    Extract text from DOCX/PPTX using Apache Tika REST API.
    
    WHY Apache Tika:
    - Official Apache project (not deprecated)
    - Handles complex Office formats
    - Extracts text from embedded objects
    - Robust format support
    
    RETURNS: Extracted text (EPHEMERAL - not persisted)
    """
    tika = get_tika_server()
    
    # Map file extension to MIME type for better extraction
    mime_types = {
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'doc': 'application/msword',
        'ppt': 'application/vnd.ms-powerpoint'
    }
    
    content_type = mime_types.get(file_ext.lower(), 'application/octet-stream')
    
    try:
        content = tika.extract_text(file_bytes, content_type)
        
        # Clean up extracted text
        if content:
            # Remove excessive whitespace
            lines = [line.strip() for line in content.split("\n") if line.strip()]
            return "\n".join(lines)
        return ""
    except Exception as e:
        print(f"DOCX/PPTX extraction failed: {e}")
        return ""

# =============================================================================
# IMAGE OCR (Tesseract)
# =============================================================================

def extract_image_ocr(file_bytes: bytes) -> str:
    """
    Extract text from image using Tesseract OCR.
    
    WHY Tesseract:
    - Open source, widely supported
    - Good accuracy for printed text
    - Supports multiple languages
    
    RETURNS: Extracted text (EPHEMERAL - not persisted)
    """
    # Load image from bytes
    from io import BytesIO
    image = Image.open(BytesIO(file_bytes))
    
    # Perform OCR
    # WHY default config: Suitable for most printed documents
    text = pytesseract.image_to_string(image)
    
    return text.strip()

# =============================================================================
# AUDIO EXTRACTION (Whisper)
# =============================================================================

def extract_audio(file_bytes: bytes, file_ext: str) -> str:
    """
    Transcribe audio using OpenAI Whisper.
    
    WHY Whisper:
    - State-of-the-art accuracy
    - Handles multiple languages
    - Works offline (no API costs)
    
    RETURNS: Transcribed text (EPHEMERAL - not persisted)
    """
    # Whisper needs a file path
    with tempfile.NamedTemporaryFile(suffix=f".{file_ext}", delete=False) as tmp:
        tmp.write(file_bytes)
        tmp_path = tmp.name
    
    try:
        model = get_whisper_model()
        result = model.transcribe(tmp_path)
        return result["text"]
    finally:
        os.unlink(tmp_path)

# =============================================================================
# VIDEO EXTRACTION (FFmpeg + Whisper)
# =============================================================================

def get_ffmpeg_path():
    """Get FFmpeg executable path from env or system PATH."""
    return os.getenv("FFMPEG_PATH", "ffmpeg")

def extract_video(file_bytes: bytes, file_ext: str) -> str:
    """
    Extract audio from video using FFmpeg, then transcribe with Whisper.
    
    WHY FFmpeg + Whisper:
    - FFmpeg: Industry standard for video processing
    - Whisper: Best-in-class transcription
    
    RETURNS: Transcribed text (EPHEMERAL - not persisted)
    """
    # Save video to temp file
    with tempfile.NamedTemporaryFile(suffix=f".{file_ext}", delete=False) as video_tmp:
        video_tmp.write(file_bytes)
        video_path = video_tmp.name
    
    # Create temp file for extracted audio
    audio_path = video_path.replace(f".{file_ext}", ".wav")
    
    try:
        # Extract audio using FFmpeg (use configured path)
        ffmpeg_cmd = get_ffmpeg_path()
        # WHY WAV output: Whisper works best with WAV format
        subprocess.run([
            ffmpeg_cmd, "-i", video_path,
            "-vn",  # No video
            "-acodec", "pcm_s16le",  # PCM codec
            "-ar", "16000",  # 16kHz sample rate (Whisper optimal)
            "-ac", "1",  # Mono
            "-y",  # Overwrite
            audio_path
        ], check=True, capture_output=True)
        
        # Transcribe audio
        model = get_whisper_model()
        result = model.transcribe(audio_path)
        return result["text"]
        
    finally:
        # Clean up temp files
        if os.path.exists(video_path):
            os.unlink(video_path)
        if os.path.exists(audio_path):
            os.unlink(audio_path)

# =============================================================================
# URL EXTRACTION (Jina Reader)
# =============================================================================

async def extract_url(url: str) -> str:
    """
    Extract content from URL using Jina Reader API.
    
    WHY Jina Reader:
    - Handles JavaScript-rendered content
    - Cleans HTML to readable text
    - API-based (no browser automation needed)
    
    RETURNS: Extracted text (EPHEMERAL - not persisted)
    """
    jina_url = f"https://r.jina.ai/{url}"
    
    headers = {}
    if JINA_API_KEY:
        headers["Authorization"] = f"Bearer {JINA_API_KEY}"
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.get(jina_url, headers=headers)
        response.raise_for_status()
        return response.text

# =============================================================================
# SUMMARIZATION (LLaMA) - Optimized with two-stage chunking
# =============================================================================

# Performance constants for LLaMA optimization
CHUNK_SIZE_TOKENS = 1000      # ~900-1200 tokens per chunk for efficient processing
CHUNK_OVERLAP_TOKENS = 75     # ~50-100 token overlap to preserve context
CHARS_PER_TOKEN = 4           # Approximate chars per token for estimation
MAX_WORKERS = 2               # ThreadPool workers for parallel chunk summarization

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE_TOKENS, overlap: int = CHUNK_OVERLAP_TOKENS) -> list[str]:
    """
    Split text into overlapping chunks for efficient summarization.
    
    WHY CHUNKING:
    - Prevents context overflow in LLM
    - Allows parallel processing of chunks
    - Better quality summaries for each section
    
    OPTIMIZATION: 900-1200 token chunks with 50-100 overlap
    - Larger chunks = fewer API calls
    - Minimal overlap = less redundancy
    """
    # Convert token counts to character estimates
    chunk_chars = chunk_size * CHARS_PER_TOKEN
    overlap_chars = overlap * CHARS_PER_TOKEN
    
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = start + chunk_chars
        
        # Try to break at sentence boundary for cleaner chunks
        if end < text_len:
            # Look for sentence end within last 200 chars of chunk
            search_start = max(end - 200, start)
            last_period = text.rfind('. ', search_start, end)
            if last_period > start:
                end = last_period + 1
        
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        
        # Move to next chunk with overlap
        start = end - overlap_chars if end < text_len else text_len
    
    return chunks

def summarize_chunk_sync(chunk: str, chunk_idx: int) -> str:
    """
    Generate bullet-point summary for a single chunk (sync for ThreadPool).
    
    OPTIMIZATION: Stage 1 of two-stage summarization
    - Short bullet points per chunk
    - max_new_tokens ≤ 250 for speed
    - temperature = 0.1 for factual output
    """
    # Stage 1 prompt: Extract key points as bullets
    prompt = f"""Extract the key points from this study material as brief bullet points.
Be concise and factual. Use 3-5 bullet points maximum.

Content:
{chunk}

Key Points:
•"""

    try:
        response = requests.post(
            LLAMA_API_URL,
            json={
                "model": "llama3.2:3b",
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.1,      # OPTIMIZATION: Low temp for factual output
                    "num_predict": 512,      # Increased for better chunk summaries
                    "top_p": 0.9,            # Focused sampling
                }
            },
            timeout=120  # Shorter timeout per chunk
        )
        response.raise_for_status()
        result = response.json()
        summary = result.get("response", "")
        # Prepend bullet if response doesn't start with one
        if summary and not summary.strip().startswith("•"):
            summary = "• " + summary
        return summary
    except Exception as e:
        return f"• [Chunk {chunk_idx + 1} processing failed: {str(e)[:50]}]"

async def generate_summary(text: str) -> str:
    """
    Generate summary using optimized two-stage LLaMA summarization.
    
    OPTIMIZATION STRATEGY:
    1. Stage 1: Parallel chunk summarization (bullet points)
    2. Stage 2: Merge and synthesize final summary
    
    WHY TWO-STAGE:
    - Better handling of long documents
    - More coherent final output
    - Parallelization reduces latency
    
    LLM PARAMETERS (optimized):
    - max_new_tokens ≤ 250 (fast generation)
    - temperature ≤ 0.2 (factual, consistent)
    - do_sample implicitly False at low temp
    """
    # Clean text first
    cleaned_text = clean_text_for_llm(text)
    
    # Check if text is short enough for single-pass summary
    if len(cleaned_text) < 3000:  # ~750 tokens - no chunking needed
        return await _generate_single_summary(cleaned_text)
    
    # Stage 1: Chunk and summarize in parallel
    chunks = chunk_text(cleaned_text)
    
    # If only 1-2 chunks, process directly without parallelization overhead
    if len(chunks) <= 2:
        chunk_summaries = []
        for i, chunk in enumerate(chunks):
            summary = summarize_chunk_sync(chunk, i)
            chunk_summaries.append(summary)
    else:
        # OPTIMIZATION: Parallel chunk processing with ThreadPoolExecutor
        chunk_summaries = await _parallel_chunk_summarization(chunks)
    
    # Stage 2: Merge chunk summaries into final summary
    merged_summary = await _merge_summaries(chunk_summaries)
    
    return merged_summary

async def _parallel_chunk_summarization(chunks: list[str]) -> list[str]:
    """
    Process chunks in parallel using ThreadPoolExecutor.
    
    OPTIMIZATION: max_workers=2 to balance speed vs memory
    - Limits concurrent LLM calls
    - Prevents memory overload
    - Still faster than sequential
    """
    loop = asyncio.get_event_loop()
    chunk_summaries = [None] * len(chunks)
    
    # Use ThreadPoolExecutor for parallel I/O-bound summarization
    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        # Submit all chunk tasks
        future_to_idx = {
            executor.submit(summarize_chunk_sync, chunk, idx): idx
            for idx, chunk in enumerate(chunks)
        }
        
        # Collect results as they complete
        for future in as_completed(future_to_idx):
            idx = future_to_idx[future]
            try:
                chunk_summaries[idx] = future.result()
            except Exception as e:
                chunk_summaries[idx] = f"• [Chunk {idx + 1} failed]"
    
    return chunk_summaries

async def _generate_single_summary(text: str) -> str:
    """
    Generate summary for short text (no chunking needed).
    
    OPTIMIZATION: Direct single-pass for texts under ~750 tokens
    """
    prompt = f"""You are a study assistant. Create a concise summary of this study material.

Focus on:
- Key concepts and definitions
- Main arguments or ideas
- Important facts

Study Material:
{text}

Summary:"""

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(
                LLAMA_API_URL,
                json={
                    "model": "llama3.2:3b",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.15,     # OPTIMIZATION: Low temp for factual output
                        "num_predict": 1024,     # Increased for complete summaries
                        "top_p": 0.9,
                    }
                }
            )
            response.raise_for_status()
            result = response.json()
            return result.get("response", "")
    except httpx.ReadTimeout:
        raise ValueError("Summary generation timed out. Please try with a smaller document.")
    except Exception as e:
        raise ValueError(f"Summary generation failed: {str(e)}")

async def _merge_summaries(chunk_summaries: list[str]) -> str:
    """
    Stage 2: Merge chunk bullet summaries into final coherent summary.
    
    OPTIMIZATION: Two-stage summarization completes here
    - Takes bullet points from all chunks
    - Synthesizes into cohesive final summary
    - Removes redundancy across chunks
    """
    # Combine all chunk summaries
    combined_bullets = "\n".join(chunk_summaries)
    
    # Stage 2 prompt: Synthesize final summary from bullets
    prompt = f"""You are a study assistant. Below are key points extracted from different sections of a study document.
Synthesize these into a clear, coherent summary. Remove any redundancy and organize logically.

Key Points from Document:
{combined_bullets}

Final Summary:"""

    try:
        async with httpx.AsyncClient(timeout=180.0) as client:
            response = await client.post(
                LLAMA_API_URL,
                json={
                    "model": "llama3.2:3b",
                    "prompt": prompt,
                    "stream": False,
                    "options": {
                        "temperature": 0.2,      # OPTIMIZATION: Slightly higher for coherent synthesis
                        "num_predict": 1024,     # Increased for complete final summaries
                        "top_p": 0.9,
                    }
                }
            )
            response.raise_for_status()
            result = response.json()
            return result.get("response", "")
    except httpx.ReadTimeout:
        # Fallback: return combined bullets if merge times out
        return "Key Points:\n" + combined_bullets
    except Exception as e:
        raise ValueError(f"Summary merge failed: {str(e)}")

def clean_text_for_llm(text: str, max_chars: int = 24000) -> str:
    """
    Clean and prepare text for LLM input.
    
    WHY:
    - Remove noise that wastes tokens
    - Limit total chars (24k chars ~6k tokens for chunking)
    - Preserve meaningful content
    - Faster processing with cleaner input
    
    OPTIMIZATION: Increased from 16k to 24k to allow for better chunking
    """
    # Remove excessive whitespace
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    cleaned = "\n".join(lines)
    
    # Truncate if too long (after chunking will handle this better)
    if len(cleaned) > max_chars:
        # Keep beginning (usually most important for documents)
        cleaned = cleaned[:max_chars] + "\n\n[Content truncated for length...]"
    
    return cleaned

# =============================================================================
# MAIN PROCESSING FUNCTIONS
# =============================================================================

async def process_file(
    firebase_uid: str,
    file_id: str,
    storage_path: str,
    file_type: str
):
    """
    Process an uploaded file: extract text → generate summary → save.
    
    DATA FLOW:
    1. Download file bytes from Firebase Storage (EPHEMERAL)
    2. Extract text using appropriate tool (EPHEMERAL)
    3. Generate summary with LLaMA (PERSIST)
    4. Save summary to Supabase (PERSIST)
    5. Clean up - extracted text is garbage collected
    """
    try:
        # 1. Update status: Extracting
        await update_status(firebase_uid, file_id, "extracting", 40, f"Extracting text from {file_type}...")
        
        # 2. Download file from Firebase Storage
        # WHY: Need bytes for extraction, but don't persist them
        file_bytes = download_from_storage(storage_path)
        
        # Get file extension
        file_ext = storage_path.split(".")[-1] if "." in storage_path else file_type
        
        # 3. Extract text using appropriate tool
        # EXTRACTED TEXT IS EPHEMERAL - stays in memory only
        if file_type == "pdf":
            extracted_text = extract_pdf(file_bytes)
        elif file_type in ["docx", "pptx"]:
            extracted_text = extract_tika(file_bytes, file_ext)
        elif file_type == "image":
            extracted_text = extract_image_ocr(file_bytes)
        elif file_type == "audio":
            extracted_text = extract_audio(file_bytes, file_ext)
        elif file_type == "video":
            extracted_text = extract_video(file_bytes, file_ext)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
        
        # 4. Clear file_bytes from memory (help garbage collector)
        del file_bytes
        
        if not extracted_text or not extracted_text.strip():
            raise ValueError("No text could be extracted from file")
        
        # 5. Update status: Summarizing
        await update_status(firebase_uid, file_id, "summarizing", 70, "Generating AI summary...")
        
        # 6. Generate summary
        # WHY PERSIST SUMMARY: Expensive to regenerate (LLM costs/time)
        summary_text = await generate_summary(extracted_text)
        
        # 7. Clear extracted_text from memory
        del extracted_text
        
        if not summary_text or not summary_text.strip():
            raise ValueError("Failed to generate summary")
        
        # 8. Save summary to Supabase (PERSIST)
        supabase = get_supabase()
        supabase.table("summaries").insert({
            "document_id": file_id,
            "firebase_uid": firebase_uid,
            "summary_text": summary_text,
            "version": 1
        }).execute()
        
        # 9. Update status: Complete
        await update_status(firebase_uid, file_id, "complete", 100, "Summary generated successfully!")
        
    except Exception as e:
        # Update status: Error
        await update_status(firebase_uid, file_id, "error", 0, str(e))
        raise

async def process_url(
    firebase_uid: str,
    file_id: str,
    url: str
):
    """
    Process a URL: extract content → generate summary → save.
    
    WHY DIFFERENT:
    - No file download needed
    - Jina Reader handles extraction
    - Same summary persistence
    """
    try:
        # 1. Update status: Extracting
        await update_status(firebase_uid, file_id, "extracting", 40, "Extracting content from URL...")
        
        # 2. Extract content using Jina Reader
        # EXTRACTED TEXT IS EPHEMERAL
        extracted_text = await extract_url(url)
        
        if not extracted_text or not extracted_text.strip():
            raise ValueError("No content could be extracted from URL")
        
        # 3. Update status: Summarizing
        await update_status(firebase_uid, file_id, "summarizing", 70, "Generating AI summary...")
        
        # 4. Generate summary (PERSIST)
        summary_text = await generate_summary(extracted_text)
        
        # 5. Clear extracted_text
        del extracted_text
        
        if not summary_text or not summary_text.strip():
            raise ValueError("Failed to generate summary")
        
        # 6. Save summary to Supabase (PERSIST)
        supabase = get_supabase()
        supabase.table("summaries").insert({
            "document_id": file_id,
            "firebase_uid": firebase_uid,
            "summary_text": summary_text,
            "version": 1
        }).execute()
        
        # 7. Update status: Complete
        await update_status(firebase_uid, file_id, "complete", 100, "Summary generated successfully!")
        
    except Exception as e:
        await update_status(firebase_uid, file_id, "error", 0, str(e))
        raise

async def process_text(firebase_uid: str, file_id: str, text: str, title: str):
    """
    Process raw text input: generate summary directly.
    
    FLOW (simplified - no extraction needed):
    1. Summarize text
    2. Save summary to Supabase
    3. Update status
    
    STORAGE:
    - Summary → Supabase (persist)
    """
    try:
        # 1. Update status: Summarizing
        await update_status(firebase_uid, file_id, "summarizing", 50, "Generating AI summary...")
        
        # 2. Generate summary (PERSIST)
        summary_text = await generate_summary(text)
        
        if not summary_text or not summary_text.strip():
            raise ValueError("Failed to generate summary")
        
        # 3. Save summary to Supabase (PERSIST)
        supabase = get_supabase()
        supabase.table("summaries").insert({
            "document_id": file_id,
            "firebase_uid": firebase_uid,
            "summary_text": summary_text,
            "version": 1
        }).execute()
        
        # 4. Update status: Complete
        await update_status(firebase_uid, file_id, "complete", 100, "Summary generated successfully!")
        
    except Exception as e:
        await update_status(firebase_uid, file_id, "error", 0, str(e))
        raise

# =============================================================================
# STORAGE SUMMARY
# =============================================================================
"""
WHAT IS PERSISTED:
✅ Raw files → Firebase Storage (source of truth, cheap object storage)
✅ File metadata → Supabase (queries, RLS)
✅ Summaries → Supabase (expensive to regenerate)

WHAT IS EPHEMERAL:
⏳ Processing status → Firestore (24h TTL, real-time updates)
⏳ File bytes → Memory only (downloaded, used, discarded)
⏳ Extracted text → Memory only (extracted, summarized, discarded)
⏳ Chunks → Memory only (if needed for context limits)

WHAT IS NEVER STORED:
❌ Extracted text in database
❌ File bytes in database
❌ Token counts
❌ Intermediate processing artifacts
❌ Duplicate copies of content
"""