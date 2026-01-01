# Setup Guide - Freaks AI Summarizer

Complete setup instructions for running this AI-powered study companion locally.

## Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.10+
- **Git**

## 1. Clone the Repository

```bash
git clone <repository-url>
cd freaks-ai-summarizer
```

## 2. Install System Dependencies

### Windows

```powershell
# Install FFmpeg
winget install ffmpeg

# Install Tesseract OCR
winget install tesseract

# Java (for Apache Tika) - usually pre-installed
# If needed: winget install Microsoft.OpenJDK.17
```

### macOS

```bash
brew install ffmpeg tesseract openjdk@17
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install ffmpeg tesseract-ocr openjdk-17-jre
```

## 3. Install Ollama + LLaMA Model

### Install Ollama

**Windows/Mac:**
Download from [ollama.ai](https://ollama.ai) and install

**Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

### Download LLaMA Model

```bash
ollama pull llama3.2:3b
```

This downloads the 2GB quantized model. Verify installation:

```bash
ollama list
```

## 4. Backend Setup (Python/FastAPI)

### Install Python Dependencies

```bash
cd backend/pipeline
pip install -r requirements.txt
```

### Configure Environment Variables

Create a `.env` file in the **project root** (not in backend/pipeline):

```bash
# Navigate back to project root
cd ../..

# Create .env file
touch .env  # or just create manually
```

Add the following to `.env`:

```env
# ===============================
# FIREBASE CONFIGURATION
# ===============================
FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
FIREBASE_SERVICE_ACCOUNT_PATH=C:/path/to/your/firebase-service-account.json

# ===============================
# SUPABASE CONFIGURATION
# ===============================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key-here

# ===============================
# OLLAMA (LOCAL LLM)
# ===============================
LLAMA_API_URL=http://localhost:11434/api/generate

# ===============================
# SYSTEM PATHS
# ===============================
# Windows examples:
JAVA_PATH=C:/Program Files/Java/jre1.8.0_471/bin/java.exe
FFMPEG_PATH=C:/ProgramData/chocolatey/bin/ffmpeg.exe

# macOS/Linux examples:
# JAVA_PATH=/usr/bin/java
# FFMPEG_PATH=/usr/local/bin/ffmpeg

# ===============================
# JINA READER (OPTIONAL)
# ===============================
JINA_READER_API_KEY=your-jina-api-key-here

# ===============================
# FRONTEND CONFIG
# ===============================
VITE_BACKEND_URL=http://localhost:8001
```

### Setup Firebase Service Account

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save as `firebase-service-account.json` in `backend/pipeline/`
6. Update `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env`

### Setup Supabase Database

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project or use existing
3. Run the SQL schema (see `database-schema.sql` if provided)
4. Get your Service Role Key from **Settings** → **API**
5. Add to `.env` as `SUPABASE_SERVICE_KEY`

## 5. Frontend Setup (React/Vite)

### Install Node Dependencies

```bash
# From project root
npm install
```

### Configure Firebase for Frontend

Create `src/firebase.js` with your Firebase web config (if not already present).

## 6. Running the Application

### Start Backend Server

Open a terminal:

```bash
cd backend/pipeline
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

Backend will run on **http://localhost:8001**

### Start Frontend Server

Open a **new terminal**:

```bash
# From project root
npm run dev
```

Frontend will run on **http://localhost:5173**

### Verify All Services

Check that all required services are running:

```bash
# Windows PowerShell
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in 5173,8001,11434} | Select-Object LocalPort, State

# macOS/Linux
lsof -i :5173,8001,11434
```

You should see:
- **5173** - Frontend (Vite)
- **8001** - Backend (FastAPI)
- **11434** - Ollama (LLaMA)

## 7. Access the Application

Open your browser and navigate to:

**http://localhost:5173**

## Troubleshooting

### Port Already in Use

**Backend (8001):**
```bash
# Windows
Get-Process -Id (Get-NetTCPConnection -LocalPort 8001).OwningProcess | Stop-Process -Force

# macOS/Linux
lsof -ti:8001 | xargs kill -9
```

**Frontend (5173):**
Kill the terminal running `npm run dev` and restart.

### Ollama Not Running

```bash
# Check if Ollama is running
ollama ps

# If not, start Ollama service
# Windows: Start from Start Menu
# macOS: Start Ollama app
# Linux: sudo systemctl start ollama
```

### Module Import Errors

```bash
# Backend
cd backend/pipeline
pip install -r requirements.txt --upgrade

# Frontend
npm install
```

### Java/FFmpeg Not Found

Update absolute paths in `.env`:

```bash
# Windows - Find Java path
where java

# Find FFmpeg path
where ffmpeg

# macOS/Linux
which java
which ffmpeg
```

### Firebase Auth Issues

- Ensure Firebase service account JSON is in correct location
- Verify `FIREBASE_SERVICE_ACCOUNT_PATH` in `.env` points to correct file
- Check Firebase project has Authentication enabled

## Development Notes

### Backend Optimizations Applied

- ✅ Two-stage summarization (chunk → merge)
- ✅ Parallel chunk processing (ThreadPoolExecutor)
- ✅ Optimized LLM parameters (temp=0.1-0.2, max_tokens=250)
- ✅ Smart chunking (1000 tokens/chunk, 75 token overlap)
- ✅ Model loaded once via Ollama (persistent memory)

### Tech Stack

**Frontend:**
- React 18
- Vite 7
- Firebase Auth
- Supabase Client
- React Router

**Backend:**
- FastAPI
- Python 3.10+
- Firebase Admin SDK
- Supabase Python Client
- PyMuPDF, Apache Tika, Whisper
- Ollama (LLaMA 3.2:3b)

**Storage:**
- Firebase Storage (raw files)
- Firestore (ephemeral status)
- Supabase PostgreSQL (metadata, summaries)

## Production Deployment

For production deployment (Railway, Render, etc.):

1. Set all environment variables in hosting platform
2. Update CORS origins in `backend/pipeline/main.py`
3. Use production Firebase/Supabase credentials
4. Consider using cloud-hosted LLM (OpenAI, Anthropic) instead of local Ollama

## License

[Add your license here]
