# Updating Your Local Installation

If you already have the repo and need to pull the latest changes, follow these steps:

## 🔄 Quick Update

```bash
# 1. Pull latest changes
git pull origin main

# 2. Update Python dependencies
cd backend/pipeline
pip install -r requirements.txt --upgrade

# 3. Update Node dependencies
cd ../..
npm install

# 4. Restart servers
```

## 📋 Step-by-Step Update Process

### 1. Stop Running Servers

**Stop Backend:**
```powershell
# Windows PowerShell
Get-Process -Id (Get-NetTCPConnection -LocalPort 8001 -ErrorAction SilentlyContinue).OwningProcess | Stop-Process -Force

# macOS/Linux
lsof -ti:8001 | xargs kill -9
```

**Stop Frontend:**
Press `Ctrl+C` in the terminal running `npm run dev`

### 2. Pull Latest Changes

```bash
git pull origin main
```

### 3. Update Backend Dependencies

```bash
cd backend/pipeline
pip install -r requirements.txt --upgrade
cd ../..
```

### 4. Update Frontend Dependencies

```bash
npm install
```

### 5. Check for Environment Variable Changes

Compare `.env.example` with your `.env`:

```bash
# Windows PowerShell
code .env.example .env

# macOS/Linux
diff .env.example .env
```

Add any new environment variables to your `.env` file.

### 6. Update Ollama Model (if needed)

Check if model version has changed:

```bash
ollama list
# If llama3.2:3b is not listed or outdated:
ollama pull llama3.2:3b
```

### 7. Restart Servers

**Backend:**
```bash
cd backend/pipeline
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

**Frontend (new terminal):**
```bash
npm run dev
```

## 🆕 Recent Updates

### Latest Changes (January 2026)

**Performance Optimizations:**
- ✅ Two-stage summarization with parallel chunk processing
- ✅ Optimized LLM parameters (temp≤0.2, tokens≤250)
- ✅ Smart chunking (1000 tokens/chunk, 75 token overlap)
- ✅ ThreadPoolExecutor for parallel processing

**Dependencies Added:**
- `concurrent.futures` (built-in, no install needed)
- `asyncio` enhancements

**No breaking changes** - All existing features remain compatible.

## 🔍 Verify Update

After updating, verify everything works:

```bash
# Check services running
Get-NetTCPConnection -State Listen | Where-Object {$_.LocalPort -in 5173,8001,11434} | Select-Object LocalPort, State

# Test backend
python -c "import requests; r = requests.get('http://localhost:8001/health', timeout=3); print('Backend:', r.status_code)"
```

Expected output:
- Port **5173**: Frontend (Vite)
- Port **8001**: Backend (FastAPI)  
- Port **11434**: Ollama (LLaMA)
- Backend test: `200`

## 🐛 Troubleshooting Updates

### Dependencies Not Installing

```bash
# Clear pip cache
pip cache purge
pip install -r backend/pipeline/requirements.txt --force-reinstall

# Clear npm cache
npm cache clean --force
npm install
```

### Git Merge Conflicts

```bash
# If you have local changes that conflict:
git stash
git pull origin main
git stash pop
# Resolve conflicts manually
```

### Database Schema Changes

If there are database schema changes, check for migration scripts:

```bash
# Look for migration files
ls migrations/
# Follow instructions in migration README
```

### Environment Variables Missing

```bash
# Compare your .env with the example
diff .env .env.example

# Add any missing variables from .env.example
```

## 📝 Stay Updated

Watch this repo or enable notifications to get alerts when new changes are pushed:

```bash
# Star the repo for updates
git config --global user.email "your-email@example.com"
```

## 🔗 Additional Resources

- [Full Setup Guide](SETUP.md) - Complete installation instructions
- [Architecture Rules](ARCHITECTURE_RULES.md) - System design decisions
- [README](README.md) - Project overview and quick start
