# AI Dev Environment Setup — Windows

## Prerequisites

- Windows 10/11, 8GB+ RAM, admin access
- Create accounts: [Anthropic](https://console.anthropic.com), [Google](https://accounts.google.com), [OpenAI](https://platform.openai.com), [GitHub](https://github.com)

## 1. Install Core Tools

Open **PowerShell as Administrator**:

```powershell
# Node.js (required for Claude Code & Gemini)
winget install OpenJS.NodeJS.LTS

# Python (required for ShellGPT)
winget install Python.Python.3.12

# Git Bash (required for Claude Code)
winget install Git.Git
```

## 2. Install AI CLI Tools

### Claude Code
```powershell
irm https://claude.ai/install.ps1 | iex
```

### Gemini CLI
```bash
npm install -g @google/gemini-cli
```

### ShellGPT
```powershell
pip install shell-gpt
```

## 3. Configure API Keys

Add to your environment or shell profile:

```powershell
$env:ANTHROPIC_API_KEY = "your-key"
$env:GEMINI_API_KEY = "your-key"
$env:OPENAI_API_KEY = "your-key"
```

## 4. Install IntelliJ IDEA + AI Plugin

```powershell
winget install JetBrains.IntelliJIDEA.Community
```

**Install GitHub Copilot (free tier):**
1. File → Settings → Plugins → Marketplace
2. Search "GitHub Copilot" → Install → Restart
3. Sign in with GitHub account

## 5. Verify Installation

```bash
claude --version && gemini --version && sgpt --version
```

## Quick Reference

| Tool | Command | Get API Key |
|------|---------|-------------|
| Claude Code | `claude` | console.anthropic.com |
| Gemini CLI | `gemini` | aistudio.google.com/apikey |
| ShellGPT | `sgpt "prompt"` | platform.openai.com/api-keys |

## Troubleshooting

- **"command not found"**: Add `$HOME/.local/bin` to PATH
- **Claude issues**: Run `claude doctor`
- **Copilot not working**: Check sign-in status in IDE status bar
