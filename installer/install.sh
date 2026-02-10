#!/usr/bin/env bash
set -e

# ============================================================
#   UCrash iWitness - One-Click Installer (Linux / macOS)
#   Smart Viral Affiliate Scan & Share Super-App
# ============================================================

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

INSTALL_DIR="$HOME/ucrash-iwitness"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo -e "${BLUE}============================================================${NC}"
echo -e "${BLUE}  UCrash iWitness - Smart Viral Affiliate Super-App${NC}"
echo -e "${BLUE}  One-Click Installer${NC}"
echo -e "${BLUE}============================================================${NC}"
echo ""

# ---- Detect OS ----
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
fi
echo -e "${GREEN}[OK]${NC} Detected OS: $OS ($OSTYPE)"

# ---- Check/Install Node.js ----
echo ""
echo -e "${BLUE}[1/7]${NC} Checking prerequisites..."
if command -v node &>/dev/null; then
    echo -e "${GREEN}[OK]${NC} Node.js found: $(node --version)"
else
    echo -e "${YELLOW}[*]${NC} Node.js not found. Installing..."
    if [[ "$OS" == "mac" ]]; then
        if command -v brew &>/dev/null; then
            brew install node
        else
            echo -e "${YELLOW}[*]${NC} Installing Homebrew first..."
            /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
            brew install node
        fi
    elif [[ "$OS" == "linux" ]]; then
        curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    echo -e "${GREEN}[OK]${NC} Node.js installed: $(node --version)"
fi

# ---- Check Git ----
if command -v git &>/dev/null; then
    echo -e "${GREEN}[OK]${NC} Git found: $(git --version)"
else
    echo -e "${YELLOW}[*]${NC} Installing Git..."
    if [[ "$OS" == "mac" ]]; then
        brew install git
    elif [[ "$OS" == "linux" ]]; then
        sudo apt-get install -y git
    fi
fi

# ---- Set up project ----
echo ""
echo -e "${BLUE}[2/7]${NC} Setting up project directory: $INSTALL_DIR"
mkdir -p "$INSTALL_DIR"

if [[ -f "$SCRIPT_DIR/package.json" ]]; then
    echo -e "${YELLOW}[*]${NC} Copying local project files..."
    cp -r "$SCRIPT_DIR"/* "$INSTALL_DIR/" 2>/dev/null || true
    cp -r "$SCRIPT_DIR"/.[!.]* "$INSTALL_DIR/" 2>/dev/null || true
elif [[ -f "$SCRIPT_DIR/../package.json" ]]; then
    echo -e "${YELLOW}[*]${NC} Copying from parent directory..."
    cp -r "$SCRIPT_DIR/../"* "$INSTALL_DIR/" 2>/dev/null || true
else
    echo -e "${YELLOW}[*]${NC} Cloning from repository..."
    git clone https://github.com/abc3rd/iwitness-android.git "$INSTALL_DIR" || {
        echo -e "${RED}[!]${NC} Clone failed. Place this installer in the project folder."
        exit 1
    }
fi

cd "$INSTALL_DIR"

# ---- Install Frontend Deps ----
echo ""
echo -e "${BLUE}[3/7]${NC} Installing frontend dependencies..."
npm install --legacy-peer-deps 2>/dev/null || npm install --force
echo -e "${GREEN}[OK]${NC} Frontend dependencies installed."

# ---- Install Backend Deps ----
echo ""
echo -e "${BLUE}[4/7]${NC} Installing backend dependencies..."
if [[ -f "backend/package.json" ]]; then
    cd "$INSTALL_DIR/backend"
    npm install --legacy-peer-deps 2>/dev/null || npm install --force
    echo -e "${GREEN}[OK]${NC} Backend dependencies installed."
    cd "$INSTALL_DIR"
fi

# ---- Create .env ----
echo ""
echo -e "${BLUE}[5/7]${NC} Setting up environment..."
if [[ -f "backend/.env.example" ]] && [[ ! -f "backend/.env" ]]; then
    cp backend/.env.example backend/.env
    echo -e "${GREEN}[OK]${NC} Backend .env created from template."
    echo -e "${YELLOW}[!]${NC} Edit backend/.env with your API keys before going live."
fi

# ---- Build Frontend ----
echo ""
echo -e "${BLUE}[6/7]${NC} Building frontend..."
npm run build 2>/dev/null && echo -e "${GREEN}[OK]${NC} Frontend built." || echo -e "${YELLOW}[WARN]${NC} Build had issues - dev server will still work."

# ---- Create launcher scripts ----
echo ""
echo -e "${BLUE}[7/7]${NC} Creating launcher scripts..."

# Start script
cat > "$INSTALL_DIR/start.sh" << 'LAUNCHER'
#!/usr/bin/env bash
echo "Starting UCrash iWitness..."
cd "$(dirname "$0")"

# Start backend
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

sleep 2

# Start frontend
npm run dev &
FRONTEND_PID=$!

sleep 3

# Open browser
if command -v xdg-open &>/dev/null; then
    xdg-open http://localhost:5173
elif command -v open &>/dev/null; then
    open http://localhost:5173
fi

echo ""
echo "UCrash iWitness is running!"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:3001"
echo ""
echo "Press Ctrl+C to stop."
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" INT TERM
wait
LAUNCHER
chmod +x "$INSTALL_DIR/start.sh"

# Stop script
cat > "$INSTALL_DIR/stop.sh" << 'STOPPER'
#!/usr/bin/env bash
echo "Stopping UCrash iWitness..."
pkill -f "tsx watch" 2>/dev/null
pkill -f "vite" 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:5173 | xargs kill -9 2>/dev/null
echo "Done."
STOPPER
chmod +x "$INSTALL_DIR/stop.sh"

# ---- Desktop shortcut (Linux) ----
if [[ "$OS" == "linux" ]]; then
    DESKTOP_DIR="$HOME/Desktop"
    mkdir -p "$DESKTOP_DIR"
    cat > "$DESKTOP_DIR/UCrash-iWitness.desktop" << DESKTOP
[Desktop Entry]
Version=1.0
Type=Application
Name=UCrash iWitness
Comment=Smart Viral Affiliate Scan & Share Super-App
Exec=bash -c "cd $INSTALL_DIR && ./start.sh"
Terminal=true
Categories=Development;
DESKTOP
    chmod +x "$DESKTOP_DIR/UCrash-iWitness.desktop"
    echo -e "${GREEN}[OK]${NC} Desktop shortcut created."
fi

# ---- macOS app alias ----
if [[ "$OS" == "mac" ]]; then
    ln -sf "$INSTALL_DIR/start.sh" "$HOME/Desktop/UCrash-iWitness.command"
    chmod +x "$HOME/Desktop/UCrash-iWitness.command"
    echo -e "${GREEN}[OK]${NC} Desktop launcher created (UCrash-iWitness.command)"
fi

echo ""
echo -e "${GREEN}============================================================${NC}"
echo -e "${GREEN}  INSTALLATION COMPLETE!${NC}"
echo -e "${GREEN}============================================================${NC}"
echo ""
echo "  Install location: $INSTALL_DIR"
echo ""
echo "  To start: double-click the desktop shortcut"
echo "  Or run:   $INSTALL_DIR/start.sh"
echo ""
echo "  NEXT STEPS:"
echo "    - Edit backend/.env with your API keys"
echo "    - Set up PostgreSQL (or run: docker-compose up postgres)"
echo ""
echo -e "${GREEN}============================================================${NC}"
