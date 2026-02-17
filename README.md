# PersonaHub 🕐

> Simplified version control for AI agent personas

**The Problem:** AI assistants can overwrite their own configuration and "forget" things. Without version control, these changes are irreversible.

**The Solution:** PersonaHub - Time Machine for your AI personas.

## Features

- 📸 **Snapshots** - Save persona state with one command
- ⏰ **Timeline** - Browse history chronologically
- 🔍 **Diff** - See what changed between versions
- ⏪ **Restore** - Rollback to any previous state (with automatic backup!)
- 🖥️ **Web UI** - Visual Time Machine interface
- 🤖 **Cron-ready** - Automated backups with retention policy
- 🧹 **Cleanup** - Automatic removal of old snapshots

## Installation

### Prerequisites

- Node.js ≥ 18
- npm

### Option 1: From Source (Recommended)

```bash
# Clone the repository
git clone https://github.com/mpriessner/personahub.git
cd personahub

# Install dependencies
npm install

# Build
npm run build

# Make globally available
sudo npm link

# Verify installation
personahub --version
```

### Option 2: Without sudo (Local Install)

```bash
# Clone and build
git clone https://github.com/mpriessner/personahub.git
cd personahub
npm install
npm run build

# Create wrapper script
mkdir -p ~/.local/bin
cat > ~/.local/bin/personahub << 'EOF'
#!/bin/bash
node ~/personahub/dist/cli.js "$@"
EOF
chmod +x ~/.local/bin/personahub

# Add to PATH (add to ~/.bashrc or ~/.zshrc)
export PATH="$HOME/.local/bin:$PATH"

# Verify
personahub --version
```

### Option 3: npm (Coming Soon)

```bash
npm install -g personahub
```

## Quick Start

```bash
# Initialize in your AI workspace
cd ~/my-agent-workspace
personahub init

# Create your first snapshot
personahub save "Initial persona setup"

# View history
personahub list

# Make changes, then save again
personahub save "Updated memory rules"

# See what changed
personahub diff 1

# Restore if needed (creates automatic backup first!)
personahub restore 1 --force
```

## Commands

| Command | Description |
|---------|-------------|
| `personahub init` | Initialize in current directory |
| `personahub save [msg]` | Create snapshot |
| `personahub list` | Show timeline |
| `personahub diff <id> [id2]` | Compare versions |
| `personahub restore <id>` | Rollback to version |
| `personahub serve` | Start Web UI (port 3000) |
| `personahub cleanup` | Remove old snapshots |

### Command Options

```bash
# Save with options
personahub save --auto              # Auto-generated message (for cron)
personahub save --quiet             # No output
personahub save --skip-unchanged    # Skip if nothing changed
personahub save --cleanup           # Run cleanup after saving

# List with limit
personahub list --limit 10

# Diff options
personahub diff 1 --stat            # Summary only (no full diff)
personahub diff 1 2                 # Compare two snapshots

# Restore without confirmation
personahub restore 1 --force

# Serve on custom port
personahub serve --port 8080
personahub serve --no-open          # Don't auto-open browser

# Cleanup
personahub cleanup --dry-run        # Preview what would be deleted
```

## Automated Backups

### Simple Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add line for every 6 hours:
0 */6 * * * cd /path/to/workspace && personahub save --auto --skip-unchanged --cleanup --quiet
```

### With Clawdbot

PersonaHub integrates seamlessly with Clawdbot's cron system for AI agent workspaces.

## Storage

PersonaHub stores data in `.personahub/`:

```
.personahub/
├── config.json      # Configuration
├── history.db       # SQLite database (metadata)
└── snapshots/       # Full file copies per snapshot
    ├── a1b2c3d4/    # Snapshot hash
    │   ├── SOUL.md
    │   ├── MEMORY.md
    │   └── ...
    └── e5f6g7h8/
        └── ...
```

## Configuration

Edit `.personahub/config.json`:

```json
{
  "version": 1,
  "include": ["**/*.md", "**/*.yaml", "**/*.yml", "**/*.json", "**/*.txt"],
  "exclude": [
    ".personahub/**",
    "node_modules/**",
    ".git/**",
    "dist/**"
  ],
  "retention": {
    "autoSnapshotDays": 7,
    "manualSnapshotDays": 30,
    "minSnapshots": 5
  }
}
```

### Retention Policy

- **autoSnapshotDays**: Days to keep automatic snapshots (default: 7)
- **manualSnapshotDays**: Days to keep manual snapshots (default: 30)
- **minSnapshots**: Always keep at least this many (default: 5)

## Web UI

Start the visual Time Machine interface:

```bash
personahub serve
```

Opens `http://localhost:3000` with:
- 📜 Snapshot timeline
- 📊 Visual diff viewer
- ⏪ One-click restore

## Why not Git?

Git is powerful but complex. PersonaHub is:

| Feature | Git | PersonaHub |
|---------|-----|------------|
| Commands | 100+ | 7 |
| Learning curve | Steep | Minutes |
| Purpose | Code | Persona files |
| UI | External tools | Built-in |
| Auto-backup | Manual setup | One cron line |
| Restore safety | Can lose work | Auto-backup first |

## Development

```bash
# Run tests (82 tests)
npm test

# Run with coverage
npm test -- --coverage

# Build
npm run build

# Development mode
npm run dev
```

## Project Structure

```
src/
├── cli.ts              # Entry point
├── commands/           # CLI commands
├── core/
│   ├── engine.ts       # Main logic
│   ├── config.ts       # Configuration
│   └── types.ts        # TypeScript types
├── storage/
│   ├── database.ts     # SQLite (sql.js)
│   └── files.ts        # File operations
└── ui/
    ├── server.ts       # Express server
    └── public/         # Web UI assets
```

## License

MIT

## Author

Built for AI agent workflows. Contributions welcome!
