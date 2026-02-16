import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

export function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'personahub-test-'));
}

export function cleanupTempDir(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}

export function createTestFiles(dir: string, files: Record<string, string>): void {
  for (const [name, content] of Object.entries(files)) {
    const filePath = path.join(dir, name);
    const fileDir = path.dirname(filePath);
    if (!fs.existsSync(fileDir)) {
      fs.mkdirSync(fileDir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);
  }
}
