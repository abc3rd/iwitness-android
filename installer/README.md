# UCrash iWitness — One-Click Installer

## Quick Install (No .exe needed)

### Windows
1. Double-click `install-windows.bat`
2. It installs everything automatically
3. Double-click "UCrash iWitness" on your Desktop to launch

### Linux / macOS
```bash
chmod +x install.sh
./install.sh
```

---

## Build as .exe (Standalone Executable)

### Method 1: Using `pkg` (Recommended)

```bash
cd installer

# Install deps
npm install

# Build Windows .exe
npm run build:exe:win
# Output: UCrash-Installer-Win.exe

# Build for Mac
npm run build:exe:mac

# Build for Linux
npm run build:exe:linux

# Build ALL platforms at once
npm run build:exe:all
# Output: dist/setup-win.exe, dist/setup-macos, dist/setup-linux
```

The resulting `.exe` is ~50MB and includes Node.js bundled inside — the user doesn't need Node.js pre-installed to run the initial installer, though Node.js will be installed for the actual app.

### Method 2: Using Inno Setup (Windows — Professional Installer)

1. Install [Inno Setup](https://jrsoftware.org/isdl.php)
2. Use the included `inno-setup.iss` script (or create your own)
3. Compile to get a professional Windows installer with:
   - Install wizard UI
   - Start menu shortcuts
   - Uninstaller
   - Desktop icon

### Method 3: Using Electron Builder (Full GUI Installer)

For a GUI installer with progress bars:

```bash
npm install electron electron-builder --save-dev
# Then wrap the installer in an Electron app
```

### Method 4: Self-Extracting Archive

```bash
# Windows — use 7-Zip SFX
# 1. Zip the entire project + install-windows.bat
# 2. Create SFX with 7-Zip:
#    7z a -sfx archive.exe project-folder/
#    This creates a .exe that extracts and runs the .bat
```

---

## What the Installer Does

1. **Checks prerequisites** — Node.js, Git, Docker (optional)
2. **Auto-installs Node.js** if missing (Windows/Mac/Linux)
3. **Copies project files** to `~/ucrash-iwitness/`
4. **Installs npm dependencies** for frontend + backend
5. **Creates `.env`** from template
6. **Builds the frontend** to `dist/`
7. **Creates Desktop shortcuts** to start/stop the app
8. **Opens browser** to http://localhost:5173

## After Installation

1. Edit `~/ucrash-iwitness/backend/.env` with your API keys
2. Set up database:
   - **Option A**: `docker-compose up postgres redis` (easiest)
   - **Option B**: Use Supabase cloud (no local DB needed)
3. Double-click "UCrash iWitness" on Desktop to start
