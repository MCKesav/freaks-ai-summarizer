# Freaks AI Summarizer

An AI-powered study companion that extracts and summarizes content from various file formats using local LLM processing.

## 🚀 Quick Start

```bash
# 1. Install dependencies
cd backend/pipeline
pip install -r requirements.txt
cd ../..
npm install

# 2. Setup environment
cp .env.example .env
# Edit .env with your credentials

# 3. Start Ollama (LLaMA model)
ollama pull llama3.2:3b

# 4. Run backend (terminal 1)
cd backend/pipeline
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# 5. Run frontend (terminal 2)
npm run dev
```

Open http://localhost:5173

## 📚 Full Setup Instructions

See [SETUP.md](SETUP.md) for complete installation and configuration guide.

## ✨ Features

- 📄 **Multi-format Support**: PDF, DOCX, PPTX, Images, Audio, Video, URLs
- 🤖 **Local AI Processing**: Uses LLaMA 3.2 via Ollama (no API costs)
- ⚡ **Optimized Performance**: Two-stage summarization with parallel processing
- 🔒 **Secure Storage**: Firebase Auth + Supabase PostgreSQL
- 📊 **Real-time Status**: Live processing updates via Firestore

## 🛠️ Tech Stack

**Frontend:** React, Vite, Firebase Auth, Supabase  
**Backend:** FastAPI, Python, Firebase Admin SDK  
**AI/ML:** Ollama (LLaMA 3.2:3b), Whisper, Tesseract  
**Storage:** Firebase Storage, Supabase PostgreSQL, Firestore  

## 📋 System Requirements

- Node.js 18+
- Python 3.10+
- Java (for document processing)
- FFmpeg (for video processing)
- Ollama (for LLM inference)

## 🔧 Key Performance Optimizations

- ✅ Two-stage summarization (chunk → merge)
- ✅ Parallel chunk processing (ThreadPoolExecutor)
- ✅ Optimized LLM parameters (temp≤0.2, tokens≤250)
- ✅ Smart chunking (1000 tokens/chunk, 75 overlap)
- ✅ Model loaded once, persistent in memory

## 📖 Documentation

- [Setup Guide](SETUP.md) - Complete installation instructions
- [Update Guide](UPDATE.md) - Pull changes and update dependencies
- [Architecture Rules](ARCHITECTURE_RULES.md) - System design decisions

## 🔄 Already Have the Repo?

If you've already cloned this repo and need to update:

```bash
git pull origin main
cd backend/pipeline && pip install -r requirements.txt --upgrade
cd ../.. && npm install
```

See [UPDATE.md](UPDATE.md) for detailed update instructions.

## 🐛 Troubleshooting

Common issues and solutions in [SETUP.md#troubleshooting](SETUP.md#troubleshooting)

## 📝 License

[Add your license here]
