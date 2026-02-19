# WSL Setup Guide — AI Dev Environment on Windows

Use this guide to set up WSL (Windows Subsystem for Linux) as your full
development environment on Windows, then run the existing `setup.sh` script
inside it. No Git Bash, no PowerShell juggling — just a clean Linux terminal.

---

## Why WSL?

- Runs a real Ubuntu environment directly inside Windows
- `setup.sh` works without any changes
- VS Code integrates natively via the Remote-WSL extension
- Your Windows files are accessible from Linux (and vice versa)

---

## Step 1 — Enable WSL

Open **PowerShell as Administrator** and run:

```powershell
wsl --install
```

This installs WSL 2 and Ubuntu (the default distro) in one step.
**Restart your PC when prompted.**

> If you already have WSL installed but on version 1, upgrade it:
> ```powershell
> wsl --set-default-version 2
> ```

---

## Step 2 — First-Time Ubuntu Setup

After restarting, Ubuntu will open automatically (or find it in the Start Menu).

1. Wait for the one-time setup to finish (~1 minute)
2. Enter a **username** (anything lowercase, e.g. `tony`)
3. Enter a **password** (you'll use this for `sudo` commands)

You now have a full Ubuntu terminal.

---

## Step 3 — Update Ubuntu

Run these commands in your Ubuntu terminal:

```bash
sudo apt update && sudo apt upgrade -y
```

---

## Step 4 — Clone the Repo Inside WSL

Keep your project files **inside the WSL filesystem** (not on `/mnt/c/...`)
for best performance.

```bash
# Go to your Linux home directory
cd ~

# Clone the repo
git clone https://github.com/NextGenDev-NGD/Tonyb29.git

# Enter the project folder
cd Tonyb29
```

---

## Step 5 — Run the Setup Script

```bash
bash setup.sh
```

The script will:
- Install `git`, `curl`, `python3`, `pip`, `build-essential`
- Install `nvm` and Node.js LTS
- Install **Claude Code**, **Gemini CLI**, and **ShellGPT**
- Create a `.env` file for your API keys
- Configure your `~/.bashrc` automatically

When it finishes, reload your shell:

```bash
source ~/.bashrc
```

---

## Step 6 — Add Your API Keys

Open the `.env` file in the project:

```bash
nano ~/Tonyb29/.env
```

Fill in your keys:

```
ANTHROPIC_API_KEY=your-anthropic-key-here
GEMINI_API_KEY=your-gemini-key-here
OPENAI_API_KEY=your-openai-key-here
```

Save with `Ctrl+O`, then `Enter`, then exit with `Ctrl+X`.

---

## Step 7 — Verify Everything Works

```bash
node --version    # e.g. v22.x.x
claude --version
gemini --version
sgpt --version
```

---

## Connecting VS Code to WSL (Recommended)

VS Code has first-class WSL support — you edit files in Linux but the UI stays
on Windows.

1. Install [VS Code](https://code.visualstudio.com) on Windows (if not already)
2. Install the **WSL** extension in VS Code
3. In your Ubuntu terminal, navigate to your project and run:
   ```bash
   code .
   ```
   VS Code will open and connect to WSL automatically.

---

## Accessing Windows Files from WSL

Your Windows drives are mounted under `/mnt/`:

| Windows Path         | WSL Path              |
|----------------------|-----------------------|
| `C:\Users\YourName`  | `/mnt/c/Users/YourName` |
| `D:\Projects`        | `/mnt/d/Projects`     |

> **Tip:** For best performance, keep project files in the WSL filesystem
> (`~/` or `/home/yourname/`), not under `/mnt/c/`.

---

## Accessing WSL Files from Windows Explorer

In Windows Explorer, type this in the address bar:

```
\\wsl$\Ubuntu\home\yourname\Tonyb29
```

Or open Explorer from the terminal:

```bash
explorer.exe .
```

---

## Useful WSL Commands (run in PowerShell)

| Command | Description |
|---------|-------------|
| `wsl` | Open default Ubuntu terminal |
| `wsl --list --verbose` | List installed distros and WSL version |
| `wsl --shutdown` | Stop all WSL instances |
| `wsl --status` | Show WSL version info |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `wsl --install` says "feature not enabled" | Enable via: Settings → Optional Features → Windows Subsystem for Linux |
| WSL 2 won't start | Ensure Virtualization is enabled in BIOS |
| `claude: command not found` after setup | Run `source ~/.bashrc` |
| Slow file access on `/mnt/c/` | Move project into `~/` (WSL filesystem) |
| VS Code won't connect | Install the **WSL** extension, not just Remote SSH |

---

## Quick Reference — Daily Usage

```bash
# Open WSL (from PowerShell or Windows Terminal)
wsl

# Navigate to project
cd ~/Tonyb29

# Use the AI CLI
ai-dev claude "your prompt"
ai-dev gemini "your prompt"
ai-dev sgpt   "your prompt"

# Open in VS Code
code .
```
