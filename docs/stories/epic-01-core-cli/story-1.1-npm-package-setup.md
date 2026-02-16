# Story 1.1: NPM Package Setup

## Context

**Project:** PersonaHub - Simplified version control for AI agent personas  
**Epic:** E1 - Core CLI & Storage  
**Story:** 1.1 - NPM Package Setup  
**Priority:** 🔴 Must  
**Estimate:** 1.5 hours  

### What is PersonaHub?
PersonaHub is a CLI tool that provides "Time Machine" style version control for AI agent configuration files (like SOUL.md, MEMORY.md, TOOLS.md). Users can create snapshots, browse history, and restore to previous states.

### Why this story?
This is the foundational setup that enables the CLI to be installed globally via npm. Without this, users can't run `personahub` commands.

---

## Dependencies

**Requires:** None (first story)  
**Blocks:** All other stories

---

## User Story

**As a** developer,  
**I want to** install PersonaHub globally via npm,  
**So that** I can use it in any project directory.

---

## Acceptance Criteria

### AC1: Package is installable
```gherkin
Given the package is published or linked locally
When I run `npm install -g personahub`
Then the installation completes without errors
And the `personahub` binary is available in PATH
```

### AC2: Version command works
```gherkin
Given PersonaHub is installed
When I run `personahub --version`
Then I see the version number (e.g., "0.1.0")
```

### AC3: Help command works
```gherkin
Given PersonaHub is installed
When I run `personahub --help`
Then I see usage information with available commands
```

### AC4: Unknown command shows help
```gherkin
Given PersonaHub is installed
When I run `personahub unknowncommand`
Then I see an error message
And I see suggestion to run `personahub --help`
```

---

## Technical Implementation

### File Structure to Create

```
personahub/
├── package.json          # NPM package config
├── tsconfig.json         # TypeScript config
├── .gitignore
├── README.md
└── src/
    ├── cli.ts            # CLI entry point
    └── index.ts          # Library exports
```

### package.json

```json
{
  "name": "personahub",
  "version": "0.1.0",
  "description": "Simplified version control for AI agent personas",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "personahub": "dist/cli.js"
  },
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/cli.ts",
    "test": "jest",
    "prepublishOnly": "npm run build"
  },
  "keywords": ["ai", "agent", "persona", "version-control", "backup"],
  "author": "Martin Priessner",
  "license": "MIT",
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "better-sqlite3": "^9.4.0",
    "chalk": "^4.1.2",
    "commander": "^12.0.0",
    "glob": "^10.3.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.8",
    "@types/node": "^20.11.0",
    "typescript": "^5.3.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### src/cli.ts (Entry Point)

```typescript
#!/usr/bin/env node

import { Command } from 'commander';

const program = new Command();

program
  .name('personahub')
  .description('Simplified version control for AI agent personas')
  .version('0.1.0');

// Commands will be added in subsequent stories
// program.command('init')...
// program.command('save')...

program.parse();
```

### src/index.ts (Library Exports)

```typescript
// Library exports for programmatic usage
export const VERSION = '0.1.0';

// Engine and types will be exported here in later stories
```

---

## Testing

### Manual Testing Steps

1. Clone/navigate to project directory
2. Run `npm install`
3. Run `npm run build`
4. Run `npm link` (for local global install)
5. Run `personahub --version` → should show "0.1.0"
6. Run `personahub --help` → should show help text
7. Run `personahub foo` → should show error + help suggestion

### Automated Tests (Optional for this story)

None required - this is setup only. Tests come in Story 1.6.

---

## Definition of Done

- [ ] package.json created with correct metadata
- [ ] tsconfig.json created
- [ ] src/cli.ts created with Commander setup
- [ ] src/index.ts created
- [ ] `npm run build` succeeds
- [ ] `npm link` works
- [ ] `personahub --version` outputs version
- [ ] `personahub --help` outputs help
- [ ] Code committed to git

---

## Notes for Implementing Agent

- Use Commander.js v12+ (ESM-compatible but we use CommonJS)
- **⚠️ CRITICAL: Use chalk@4.1.2** (NOT v5!) - v5 is ESM-only and breaks CommonJS
- The CLI entry point needs `#!/usr/bin/env node` shebang
- After build, dist/cli.js must be executable

## Review Fixes Applied
- ✅ Chalk v5 → v4.1.2 (ESM/CommonJS compatibility)
