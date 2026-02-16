# PersonaHub 🎭

> Simplified version control for AI agent personas

**The Problem:** AI assistants can overwrite their own configuration and "forget" things. Without version control, these changes are irreversible.

**The Solution:** PersonaHub - Time Machine for your AI personas.

## Features

- 📸 **Snapshots** - Save persona state with one command
- ⏰ **Timeline** - Browse history chronologically
- 🔍 **Diff** - See what changed between versions
- ⏪ **Restore** - Rollback to any previous state
- 🖥️ **Time Machine UI** - Visual web interface
- 🤖 **Cron-ready** - Automated daily backups

## Quick Start

```bash
# Install globally
npm install -g personahub

# Initialize in your workspace
cd ~/my-agent-workspace
personahub init

# Create a snapshot
personahub save "Initial persona setup"

# View history
personahub list

# Restore if needed
personahub restore 1
```

## Commands

| Command | Description |
|---------|-------------|
| `personahub init` | Initialize in current directory |
| `personahub save [msg]` | Create snapshot |
| `personahub list` | Show timeline |
| `personahub diff <id>` | Compare versions |
| `personahub restore <id>` | Rollback to version |
| `personahub serve` | Start Time Machine UI |

## Automated Backups

Add to crontab for daily snapshots at 6 AM:

```bash
0 6 * * * cd /path/to/workspace && personahub save --auto --quiet
```

## Storage

PersonaHub stores data in `.personahub/`:

```
.personahub/
├── config.json      # Configuration
├── history.db       # SQLite database
└── snapshots/       # Versioned file copies
    ├── abc123/
    ├── def456/
    └── ...
```

## Configuration

Edit `.personahub/config.json`:

```json
{
  "include": ["*.md", "*.yaml", "*.json"],
  "exclude": [".personahub/**", "node_modules/**"]
}
```

## Why not Git?

Git is powerful but complex. PersonaHub is:
- **Simpler** - 6 commands vs 100+
- **Purpose-built** - Designed for persona files
- **Visual** - Time Machine UI for non-technical users
- **Automated** - Cron-first design

## License

MIT
