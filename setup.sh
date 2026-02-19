#!/usr/bin/env bash
# AI Dev Environment Setup — Linux
# Installs Node.js (via nvm), Git, and Claude Code
# Gemini CLI and ShellGPT are optional (pass --with-gemini or --with-sgpt)
# Usage: bash setup.sh [--with-gemini] [--with-sgpt]

set -euo pipefail

# ─── Flags ────────────────────────────────────────────────────────────────────
WITH_GEMINI=false
WITH_SGPT=false
for arg in "$@"; do
    case "$arg" in
        --with-gemini) WITH_GEMINI=true ;;
        --with-sgpt)   WITH_SGPT=true ;;
    esac
done

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
        sudo apt-get install -y git curl build-essential
    elif command_exists dnf; then
        sudo dnf install -y git curl gcc make
    elif command_exists pacman; then
        sudo pacman -Sy --noconfirm git curl base-devel
    elif command_exists brew; then
        brew install git curl
    else
        warn "Unknown package manager. Install git and curl manually."
    fi
    success "System packages installed."
}

# ─── 2. Node.js via nvm ───────────────────────────────────────────────────────
install_node() {
    header "Installing Node.js LTS via nvm"
    if command_exists node; then
        success "Node.js already installed: $(node --version)"
        return
    fi

    NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    if [ ! -d "$NVM_DIR" ]; then
        info "Downloading nvm..."
        curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    fi

    export NVM_DIR="$HOME/.nvm"
    # shellcheck source=/dev/null
    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

    nvm install --lts
    nvm use --lts
    nvm alias default node
    success "Node.js $(node --version) installed."
}

# ─── 3. Claude Code ───────────────────────────────────────────────────────────
install_claude() {
    header "Installing Claude Code"
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    # shellcheck source=/dev/null
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

# ─── 4. Gemini CLI (optional) ─────────────────────────────────────────────────
install_gemini() {
    header "Installing Gemini CLI (optional)"
    export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
    # shellcheck source=/dev/null
    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

    if command_exists gemini; then
        success "Gemini CLI already installed: $(gemini --version 2>/dev/null || echo 'unknown version')"
        return
    fi

    npm install -g @google/gemini-cli
    success "Gemini CLI installed. Get a free key at: aistudio.google.com/apikey"
}

# ─── 5. ShellGPT (optional) ───────────────────────────────────────────────────
install_shellgpt() {
    header "Installing ShellGPT (optional)"
    if command_exists sgpt; then
        success "ShellGPT already installed: $(sgpt --version 2>/dev/null || echo 'unknown version')"
        return
    fi

    if command_exists pipx; then
        pipx install shell-gpt
    elif command_exists pip3; then
        pip3 install --user shell-gpt
    elif command_exists pip; then
        pip install --user shell-gpt
    else
        error "pip/pipx not found. Install pipx first: sudo apt install pipx"
        return 1
    fi

    success "ShellGPT installed. Requires an OpenAI API key."
}

# ─── 6. .env file ─────────────────────────────────────────────────────────────
setup_env() {
    header "Setting up .env file"
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    ENV_FILE="$SCRIPT_DIR/.env"

    if [ -f "$ENV_FILE" ]; then
        warn ".env already exists — skipping. Edit it manually to update keys."
        return
    fi

    cat > "$ENV_FILE" <<'EOF'
# Claude Code authenticates via 'claude login' with your claude.ai subscription.
# An API key below is only needed if you want direct API access (not required).
# ANTHROPIC_API_KEY=your-anthropic-key-here

# Optional — only needed if you installed Gemini CLI or ShellGPT
# GEMINI_API_KEY=your-gemini-key-here
# OPENAI_API_KEY=your-openai-key-here
EOF
    success "Created .env at: $ENV_FILE"
    info "Claude Code uses your claude.ai subscription — no API key needed."
    info "Run 'claude' to log in with your subscription."
}

# ─── 7. Shell profile ─────────────────────────────────────────────────────────
configure_profile() {
    header "Configuring shell profile"
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

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

# Load API keys from .env if present (uncommented keys only)
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
    # shellcheck source=/dev/null
    [ -s "$NVM_DIR/nvm.sh" ] && source "$NVM_DIR/nvm.sh"

    check_required() {
        local name="$1"; shift
        if "$@" &>/dev/null; then
            success "$name: $("$@" 2>/dev/null | head -1)"
        else
            warn "$name: not found (may need to reload shell)"
        fi
    }

    check_optional() {
        local name="$1"; shift
        if "$@" &>/dev/null; then
            success "$name: $("$@" 2>/dev/null | head -1) (optional)"
        else
            info "$name: not installed (optional — skip or run with --with-${name})"
        fi
    }

    check_required "node"   node --version
    check_required "npm"    npm --version
    check_required "git"    git --version
    check_required "claude" claude --version
    check_optional "gemini" gemini --version
    check_optional "sgpt"   sgpt --version
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

    if $WITH_GEMINI; then
        install_gemini
    fi

    if $WITH_SGPT; then
        install_shellgpt
    fi

    setup_env
    configure_profile
    verify_tools

    echo ""
    echo -e "${BOLD}${GREEN}Setup complete!${RESET}"
    echo ""
    echo "Next steps:"
    echo "  1. Reload your shell:  source ~/.bashrc"
    echo "  2. Log in to Claude:   claude"
    echo "  3. Launch the AI CLI:  ai-dev"
    echo ""
    echo "Quick reference:"
    echo "  ai-dev claude \"prompt\"         — Claude Code"
    echo "  ai-dev --help                  — show all options"
    echo ""
    if ! $WITH_GEMINI && ! $WITH_SGPT; then
        echo -e "${CYAN}Optional extras (add later if needed):${RESET}"
        echo "  bash setup.sh --with-gemini    — add Gemini CLI (free tier available)"
        echo "  bash setup.sh --with-sgpt      — add ShellGPT  (requires OpenAI key)"
    fi
}

main "$@"
