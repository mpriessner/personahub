import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { globSync } from 'glob';
import { Config } from '../core/config';
import { TrackedFile } from '../core/types';

export function getTrackedFiles(workDir: string, config: Config): TrackedFile[] {
  const files: TrackedFile[] = [];
  const seen = new Set<string>();
  
  for (const pattern of config.include) {
    const matches = globSync(pattern, {
      cwd: workDir,
      ignore: config.exclude,
      nodir: true,
      dot: false
    });
    
    for (const match of matches) {
      // Avoid duplicates if multiple patterns match same file
      if (seen.has(match)) continue;
      seen.add(match);
      
      const fullPath = path.join(workDir, match);
      
      // Skip if file doesn't exist (race condition) or is directory
      if (!fs.existsSync(fullPath)) continue;
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) continue;
      
      const hash = hashFile(fullPath);
      
      files.push({
        path: fullPath,
        relativePath: match,
        size: stat.size,
        hash
      });
    }
  }
  
  // Sort for consistent ordering
  files.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  
  return files;
}

export function hashFile(filePath: string): string {
  const content = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

export function hashContent(content: Buffer | string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
}

/**
 * Validate that a resolved path is within the expected base directory.
 * Prevents path traversal attacks.
 */
export function validatePath(basePath: string, relativePath: string): string {
  const resolvedBase = path.resolve(basePath);
  const resolvedFull = path.resolve(basePath, relativePath);
  
  if (!resolvedFull.startsWith(resolvedBase + path.sep) && resolvedFull !== resolvedBase) {
    throw new Error(`Invalid file path detected: ${relativePath} (path traversal attempt)`);
  }
  
  return resolvedFull;
}

/**
 * Copy a file safely, creating directories as needed.
 */
export function copyFileSafe(src: string, dest: string): void {
  const destDir = path.dirname(dest);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  fs.copyFileSync(src, dest);
}

/**
 * Check if a file appears to be binary.
 */
export function isBinaryFile(filePath: string): boolean {
  const buffer = Buffer.alloc(512);
  const fd = fs.openSync(filePath, 'r');
  const bytesRead = fs.readSync(fd, buffer, 0, 512, 0);
  fs.closeSync(fd);
  
  // Check for null bytes (common in binary files)
  for (let i = 0; i < bytesRead; i++) {
    if (buffer[i] === 0) {
      return true;
    }
  }
  return false;
}
