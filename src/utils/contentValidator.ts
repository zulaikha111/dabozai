/**
 * Content validation utilities for build process
 * Validates content structure during build and ensures proper content handling
 * Requirements: 6.1, 6.3
 */
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import type { ZodSchema, ZodError } from 'zod';
import {
  productSchema,
  testimonialsFileSchema,
  repositoriesFileSchema,
  publicationsFileSchema,
  resumeFileSchema,
} from './schemas';

export interface ValidationResult {
  valid: boolean;
  file: string;
  errors?: string[];
}

export interface ContentValidationReport {
  success: boolean;
  timestamp: string;
  results: ValidationResult[];
  summary: {
    total: number;
    valid: number;
    invalid: number;
  };
}

/**
 * Validates a single YAML file against a schema
 */
export function validateYamlFile<T>(filePath: string, schema: ZodSchema<T>): ValidationResult {
  const result: ValidationResult = {
    valid: false,
    file: filePath,
  };

  try {
    if (!fs.existsSync(filePath)) {
      result.errors = [`File not found: ${filePath}`];
      return result;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const parsed = yaml.load(content);
    const validation = schema.safeParse(parsed);

    if (validation.success) {
      result.valid = true;
    } else {
      result.errors = formatZodErrors(validation.error);
    }
  } catch (error) {
    result.errors = [`Parse error: ${error instanceof Error ? error.message : String(error)}`];
  }

  return result;
}

/**
 * Validates a markdown file with frontmatter against a schema
 */
export function validateMarkdownFile<T>(filePath: string, schema: ZodSchema<T>): ValidationResult {
  const result: ValidationResult = {
    valid: false,
    file: filePath,
  };

  try {
    if (!fs.existsSync(filePath)) {
      result.errors = [`File not found: ${filePath}`];
      return result;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const frontmatter = extractFrontmatter(content);

    if (!frontmatter) {
      result.errors = ['No frontmatter found in markdown file'];
      return result;
    }

    const validation = schema.safeParse(frontmatter);

    if (validation.success) {
      result.valid = true;
    } else {
      result.errors = formatZodErrors(validation.error);
    }
  } catch (error) {
    result.errors = [`Parse error: ${error instanceof Error ? error.message : String(error)}`];
  }

  return result;
}

/**
 * Extracts frontmatter from markdown content
 */
export function extractFrontmatter(content: string): Record<string, unknown> | null {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return null;
  }

  try {
    return yaml.load(match[1]) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/**
 * Formats Zod validation errors into readable strings
 */
function formatZodErrors(error: ZodError): string[] {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return path ? `${path}: ${err.message}` : err.message;
  });
}

/**
 * Gets all files in a directory matching a pattern
 */
export function getFilesInDirectory(dir: string, extensions: string[]): string[] {
  if (!fs.existsSync(dir)) {
    return [];
  }

  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.includes(ext)) {
        files.push(path.join(dir, entry.name));
      }
    }
  }

  return files;
}

/**
 * Validates all content files in the project
 * This function is designed to be called during the build process
 */
export function validateAllContent(basePath: string = '.'): ContentValidationReport {
  const results: ValidationResult[] = [];

  // Validate YAML data files
  const yamlValidations: Array<{ path: string; schema: ZodSchema }> = [
    { path: path.join(basePath, 'src/data/resume.yaml'), schema: resumeFileSchema },
    { path: path.join(basePath, 'src/data/testimonials.yaml'), schema: testimonialsFileSchema },
    { path: path.join(basePath, 'src/data/repositories.yaml'), schema: repositoriesFileSchema },
    { path: path.join(basePath, 'src/data/publications.yaml'), schema: publicationsFileSchema },
  ];

  for (const { path: filePath, schema } of yamlValidations) {
    if (fs.existsSync(filePath)) {
      results.push(validateYamlFile(filePath, schema));
    }
  }

  // Validate product markdown files
  const productsDir = path.join(basePath, 'src/data/products');
  const productFiles = getFilesInDirectory(productsDir, ['.md', '.mdx']);

  for (const productFile of productFiles) {
    // Skip .gitkeep files
    if (path.basename(productFile) === '.gitkeep') continue;
    results.push(validateMarkdownFile(productFile, productSchema));
  }

  // Calculate summary
  const valid = results.filter((r) => r.valid).length;
  const invalid = results.filter((r) => !r.valid).length;

  return {
    success: invalid === 0,
    timestamp: new Date().toISOString(),
    results,
    summary: {
      total: results.length,
      valid,
      invalid,
    },
  };
}

/**
 * Checks if a content file has been modified since a given timestamp
 */
export function hasFileChanged(filePath: string, sinceTimestamp: number): boolean {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtimeMs > sinceTimestamp;
  } catch {
    return false;
  }
}

/**
 * Gets the last modified timestamp for a content file
 */
export function getFileModifiedTime(filePath: string): number | null {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtimeMs;
  } catch {
    return null;
  }
}

/**
 * Watches content directories for changes (for development mode)
 * Returns a cleanup function to stop watching
 */
export function watchContentDirectories(
  basePath: string,
  onChange: (filePath: string) => void
): () => void {
  const watchPaths = [
    path.join(basePath, 'src/data'),
    path.join(basePath, 'src/content'),
  ];

  const watchers: fs.FSWatcher[] = [];

  for (const watchPath of watchPaths) {
    if (fs.existsSync(watchPath)) {
      const watcher = fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
        if (filename) {
          onChange(path.join(watchPath, filename));
        }
      });
      watchers.push(watcher);
    }
  }

  // Return cleanup function
  return () => {
    for (const watcher of watchers) {
      watcher.close();
    }
  };
}

/**
 * Generates a content manifest for tracking changes
 */
export function generateContentManifest(basePath: string = '.'): Record<string, number> {
  const manifest: Record<string, number> = {};

  const contentPaths = [
    path.join(basePath, 'src/data'),
    path.join(basePath, 'src/content'),
  ];

  for (const contentPath of contentPaths) {
    if (!fs.existsSync(contentPath)) continue;

    const files = getAllFilesRecursive(contentPath);
    for (const file of files) {
      const modTime = getFileModifiedTime(file);
      if (modTime !== null) {
        manifest[file] = modTime;
      }
    }
  }

  return manifest;
}

/**
 * Recursively gets all files in a directory
 */
function getAllFilesRecursive(dir: string): string[] {
  const files: string[] = [];

  if (!fs.existsSync(dir)) {
    return files;
  }

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...getAllFilesRecursive(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Compares two content manifests to detect changes
 */
export function detectContentChanges(
  oldManifest: Record<string, number>,
  newManifest: Record<string, number>
): {
  added: string[];
  modified: string[];
  deleted: string[];
} {
  const added: string[] = [];
  const modified: string[] = [];
  const deleted: string[] = [];

  // Check for added and modified files
  for (const [file, newTime] of Object.entries(newManifest)) {
    if (!(file in oldManifest)) {
      added.push(file);
    } else if (oldManifest[file] !== newTime) {
      modified.push(file);
    }
  }

  // Check for deleted files
  for (const file of Object.keys(oldManifest)) {
    if (!(file in newManifest)) {
      deleted.push(file);
    }
  }

  return { added, modified, deleted };
}
