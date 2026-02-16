import * as fs from 'fs';
import * as path from 'path';

export interface Config {
  version: number;
  include: string[];
  exclude: string[];
  snapshotDir: string;
}

export const DEFAULT_CONFIG: Config = {
  version: 1,
  include: ['**/*.md', '**/*.yaml', '**/*.yml', '**/*.json', '**/*.txt'],
  exclude: [
    '.personahub/**',
    'node_modules/**',
    '.git/**',
    'dist/**',
    'build/**',
    '*.log',
    '.DS_Store',
    'Thumbs.db',
    'package-lock.json',
    'yarn.lock'
  ],
  snapshotDir: '.personahub/snapshots'
};

export function loadConfig(configPath: string): Config {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found: ${configPath}`);
  }
  
  const content = fs.readFileSync(configPath, 'utf-8');
  
  try {
    const config = JSON.parse(content) as Config;
    validateConfig(config);
    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config: ${error.message}`);
    }
    throw error;
  }
}

export function saveConfig(configPath: string, config: Config): void {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
}

export function validateConfig(config: Config): void {
  if (typeof config.version !== 'number') {
    throw new Error('Config missing or invalid "version" field');
  }
  
  if (!Array.isArray(config.include)) {
    throw new Error('Config "include" must be an array');
  }
  
  if (!Array.isArray(config.exclude)) {
    throw new Error('Config "exclude" must be an array');
  }
  
  if (typeof config.snapshotDir !== 'string') {
    throw new Error('Config "snapshotDir" must be a string');
  }
  
  // Ensure .personahub is always excluded (safety)
  if (!config.exclude.some(p => p.includes('.personahub'))) {
    config.exclude.push('.personahub/**');
  }
}

export function getConfigPath(workDir: string): string {
  return path.join(workDir, '.personahub', 'config.json');
}
