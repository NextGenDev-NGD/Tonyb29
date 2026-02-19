#!/usr/bin/env bash
# AI Dev Environment Setup — Linux
# Based on windows-ai-dev-setup.md
# Installs Node.js (via nvm), Python 3, Git, Claude Code, Gemini CLI, ShellGPT
# Usage: bash setup.sh

set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET} $*"; }
success() { echo -e "${GREEN}[OK]${RESET}  $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET} $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; }
header()  { echo -e "\n${BOLD}${CYAN}==> $*${RESET}"; }

# ─── Helpers ──────────────────────────────────────────────────────────────────
command_exists() { command -v "$1" &>/dev/null; }

require_sudo() {
    if ! sudo -n true 2>/dev/null; then
        warn "Some steps require sudo. You may be prompted for your password."
    fi
}

# ─── 1. System packages ───────────────────────────────────────────────────────
install_system_packages() {
    header "Installing system packages (git, curl, build-essential)"
    if command_exists apt-get; then
        sudo apt-get update -qq
        sudo apt-get install -y git curl build-essential python3 python3-pip python3-venv
    elif command_exists dnf; then
        sudo dnf install -y git curl gcc make python3 python3-pip
    elif command_exists pacman; then
        sudo pacman -Sy --noconfirm git curl base-devel python python-pip
    elif command_exists brew; then
        brew install git curl python
    else
        warn "Unknown package manager. Install git, curl, and python3 manually."
    fi
    success "System packages installed."
}

# ─── 2. Node.js via nvm ───────────────────────────────────────────────────────
install_node() {
    header "Installing Node.js LTS via nvm"
    if command_exists node; then
        NODE_VER=$(node --version)
        success "Node.js already installed: $NODE_VER"
        return
    fi

    NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    if [ ! -d "$NVM_DIR" ]; then
        info "Downloading nvm..."
        curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    fi

    # Load nvm for this session
    # shellcheck source=/dev/null
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

    nvm install --lts
    nvm use --lts
    nvm alias default node
    success "Node.js $(node --version) installed."
}

# ─── 3. Claude Code ───────────────────────────────────────────────────────────
install_claude() {
    header "Installing Claude Code"
    # Load nvm if needed
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

    if command_exists claude; then
        success "Claude Code already installed: $(claude --version 2>/dev/null || echo 'unknown version')"
        return
    fi

    if command_exists npm; then
        npm install -g @anthropic-ai/claude-code
        success "Claude Code installed: $(claude --version 2>/dev/null || echo 'check with: claude --version')"
    else
        error "npm not found. Node.js installation may have failed."
        exit 1
    fi
}

# ─── 4. Gemini CLI ────────────────────────────────────────────────────────────
install_gemini() {
    header "Installing Gemini CLI"
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

    if command_exists gemini; then
        success "Gemini CLI already installed: $(gemini --version 2>/dev/null || echo 'unknown version')"
        return
    fi

    npm install -g @google/gemini-cli
    success "Gemini CLI installed."
}

# ─── 5. ShellGPT ──────────────────────────────────────────────────────────────
install_shellgpt() {
    header "Installing ShellGPT"
    if command_exists sgpt; then
        success "ShellGPT already installed: $(sgpt --version 2>/dev/null || echo 'unknown version')"
        return
    fi

    # Prefer pipx for isolated install; fall back to pip with --user
    if command_exists pipx; then
        pipx install shell-gpt
    elif command_exists pip3; then
        pip3 install --user shell-gpt
    elif command_exists pip; then
        pip install --user shell-gpt
    else
        error "pip not found. Python installation may have failed."
        exit 1
    fi

    success "ShellGPT installed."
}

# ─── 6. .env file ─────────────────────────────────────────────────────────────
setup_env() {
    header "Setting up .env file"
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    ENV_FILE="$SCRIPT_DIR/.env"
    EXAMPLE_FILE="$SCRIPT_DIR/.env.example"

    if [ -f "$ENV_FILE" ]; then
        warn ".env already exists — skipping. Edit it manually to update keys."
        return
    fi

    if [ -f "$EXAMPLE_FILE" ]; then
        cp "$EXAMPLE_FILE" "$ENV_FILE"
        warn "Created .env from .env.example. Fill in your API keys:"
        echo "      $ENV_FILE"
    else
        cat > "$ENV_FILE" <<'EOF'
ANTHROPIC_API_KEY=your-anthropic-key-here
GEMINI_API_KEY=your-gemini-key-here
OPENAI_API_KEY=your-openai-key-here
EOF
        warn "Created blank .env. Fill in your API keys:"
        echo "      $ENV_FILE"
    fi
}

# ─── 7. Shell profile ─────────────────────────────────────────────────────────
configure_profile() {
    header "Configuring shell profile"
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

    # Detect active shell profile
    if [ -n "${ZSH_VERSION-}" ] || [ "$(basename "$SHELL")" = "zsh" ]; then
        PROFILE="$HOME/.zshrc"
    else
        PROFILE="$HOME/.bashrc"
    fi

    MARKER="# AI Dev Env"
    if grep -q "$MARKER" "$PROFILE" 2>/dev/null; then
        success "Shell profile already configured ($PROFILE)."
        return
    fi

    cat >> "$PROFILE" <<EOF

$MARKER — added by setup.sh
export NVM_DIR="\$HOME/.nvm"
[ -s "\$NVM_DIR/nvm.sh" ] && source "\$NVM_DIR/nvm.sh"
[ -s "\$NVM_DIR/bash_completion" ] && source "\$NVM_DIR/bash_completion"

# Load AI API keys if .env exists
if [ -f "$SCRIPT_DIR/.env" ]; then
    set -a
    # shellcheck source=/dev/null
    source "$SCRIPT_DIR/.env"
    set +a
fi

# ai-dev CLI on PATH
export PATH="\$PATH:$SCRIPT_DIR"
EOF

    success "Updated $PROFILE. Reload with: source $PROFILE"
}

# ─── 8. Verify ────────────────────────────────────────────────────────────────
verify_tools() {
    header "Verifying installations"
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

    local all_ok=true

    check() {
        local name="$1"; shift
        if "$@" &>/dev/null; then
            success "$name: $("$@" 2>/dev/null | head -1)"
        else
            warn "$name: not found or not in PATH yet (may need to reload shell)"
            all_ok=false
        fi
    }

    check "node"   node --version
    check "npm"    npm --version
    check "python" python3 --version
    check "git"    git --version
    check "claude" claude --version
    check "gemini" gemini --version
    check "sgpt"   sgpt --version

    if $all_ok; then
        echo ""
        success "All tools verified."
    else
        echo ""
        warn "Some tools could not be verified. Run: source ~/.bashrc (or ~/.zshrc) and re-run this script."
    fi
}

# ─── Main ─────────────────────────────────────────────────────────────────────
main() {
    echo -e "${BOLD}${CYAN}"
    echo "╔══════════════════════════════════════════╗"
    echo "║     AI Dev Environment Setup — Linux     ║"
    echo "╚══════════════════════════════════════════╝"
    echo -e "${RESET}"

    require_sudo
    install_system_packages
    install_node
    install_claude
    install_gemini
    install_shellgpt
    setup_env
    configure_profile
    verify_tools

    echo ""
    echo -e "${BOLD}${GREEN}Setup complete!${RESET}"
    echo ""
    echo "Next steps:"
    echo "  1. Edit .env and add your API keys"
    echo "  2. Reload your shell:  source ~/.bashrc"
    echo "  3. Launch the AI CLI:  ai-dev"
    echo ""
    echo "Quick reference:"
    echo "  ai-dev claude \"prompt\"   — Claude Code"
    echo "  ai-dev gemini \"prompt\"   — Gemini CLI"
    echo "  ai-dev sgpt   \"prompt\"   — ShellGPT (OpenAI)"
    echo "  ai-dev --help            — show all options"
}

main "$@"
