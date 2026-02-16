import * as path from 'path';
import * as fs from 'fs';
import { 
  loadConfig, 
  saveConfig, 
  validateConfig, 
  DEFAULT_CONFIG,
  Config,
  getConfigPath
} from '../../src/core/config';
import { createTempDir, cleanupTempDir } from '../helpers/setup';

describe('Config', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  describe('DEFAULT_CONFIG', () => {
    test('has required fields', () => {
      expect(DEFAULT_CONFIG.version).toBe(1);
      expect(Array.isArray(DEFAULT_CONFIG.include)).toBe(true);
      expect(Array.isArray(DEFAULT_CONFIG.exclude)).toBe(true);
      expect(typeof DEFAULT_CONFIG.snapshotDir).toBe('string');
    });

    test('includes common persona patterns', () => {
      expect(DEFAULT_CONFIG.include).toContain('**/*.md');
      expect(DEFAULT_CONFIG.include).toContain('**/*.yaml');
    });

    test('excludes .personahub', () => {
      expect(DEFAULT_CONFIG.exclude.some(p => p.includes('.personahub'))).toBe(true);
    });
  });

  describe('saveConfig', () => {
    test('creates file', () => {
      const configPath = path.join(tempDir, 'config.json');
      saveConfig(configPath, DEFAULT_CONFIG);
      expect(fs.existsSync(configPath)).toBe(true);
    });

    test('writes valid JSON', () => {
      const configPath = path.join(tempDir, 'config.json');
      saveConfig(configPath, DEFAULT_CONFIG);
      const content = fs.readFileSync(configPath, 'utf-8');
      expect(() => JSON.parse(content)).not.toThrow();
    });

    test('creates parent directories', () => {
      const configPath = path.join(tempDir, 'deep', 'nested', 'config.json');
      saveConfig(configPath, DEFAULT_CONFIG);
      expect(fs.existsSync(configPath)).toBe(true);
    });
  });

  describe('loadConfig', () => {
    test('reads saved config', () => {
      const configPath = path.join(tempDir, 'config.json');
      saveConfig(configPath, DEFAULT_CONFIG);
      
      const loaded = loadConfig(configPath);
      expect(loaded.version).toBe(DEFAULT_CONFIG.version);
      expect(loaded.include).toEqual(DEFAULT_CONFIG.include);
    });

    test('throws on missing file', () => {
      expect(() => {
        loadConfig(path.join(tempDir, 'nonexistent.json'));
      }).toThrow(/not found/);
    });

    test('throws on invalid JSON', () => {
      const configPath = path.join(tempDir, 'invalid.json');
      fs.writeFileSync(configPath, 'not valid json');
      
      expect(() => loadConfig(configPath)).toThrow(/Invalid JSON/);
    });
  });

  describe('validateConfig', () => {
    test('accepts valid config', () => {
      expect(() => validateConfig({ ...DEFAULT_CONFIG })).not.toThrow();
    });

    test('rejects missing version', () => {
      const invalid = { ...DEFAULT_CONFIG, version: undefined } as any;
      expect(() => validateConfig(invalid)).toThrow(/version/);
    });

    test('rejects non-array include', () => {
      const invalid = { ...DEFAULT_CONFIG, include: 'not-array' } as any;
      expect(() => validateConfig(invalid)).toThrow(/include.*array/);
    });

    test('rejects non-array exclude', () => {
      const invalid = { ...DEFAULT_CONFIG, exclude: 'not-array' } as any;
      expect(() => validateConfig(invalid)).toThrow(/exclude.*array/);
    });

    test('rejects non-string snapshotDir', () => {
      const invalid = { ...DEFAULT_CONFIG, snapshotDir: 123 } as any;
      expect(() => validateConfig(invalid)).toThrow(/snapshotDir.*string/);
    });

    test('adds .personahub to exclude if missing', () => {
      const config: Config = {
        version: 1,
        include: ['*.md'],
        exclude: [],
        snapshotDir: '.personahub/snapshots'
      };
      
      validateConfig(config);
      expect(config.exclude.some(p => p.includes('.personahub'))).toBe(true);
    });
  });

  describe('getConfigPath', () => {
    test('returns correct path', () => {
      const result = getConfigPath('/some/work/dir');
      expect(result).toBe('/some/work/dir/.personahub/config.json');
    });
  });
});
