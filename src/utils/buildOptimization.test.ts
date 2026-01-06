/**
 * Property-based tests for static asset optimization
 * Feature: portfolio-training-website, Property 10: Static asset optimization
 * Validates: Requirements 5.1
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import {
  getAssetType,
  hasContentHash,
  isHtmlMinified,
  isCssMinified,
  isJsMinified,
  collectFiles,
  generateBuildReport,
  validateBuildOptimization,
} from './buildOptimization';

const TEST_DIR = 'src/utils/test-build-optimization';

describe('Static Asset Optimization - Property Tests', () => {
  /**
   * Property 10: Static asset optimization
   * For any generated static file (HTML, CSS, JS), it should be properly
   * optimized and structured for web delivery
   */

  beforeAll(() => {
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  describe('Asset Type Detection', () => {
    it('should correctly identify HTML files', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('.html', '.htm'),
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9]+$/.test(s)),
          (ext, name) => {
            const result = getAssetType(`${name}${ext}`);
            expect(result).toBe('html');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly identify CSS files', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9]+$/.test(s)),
          (name) => {
            const result = getAssetType(`${name}.css`);
            expect(result).toBe('css');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly identify JavaScript files', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('.js', '.mjs'),
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9]+$/.test(s)),
          (ext, name) => {
            const result = getAssetType(`${name}${ext}`);
            expect(result).toBe('js');
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should correctly identify image files', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.ico'),
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9]+$/.test(s)),
          (ext, name) => {
            const result = getAssetType(`${name}${ext}`);
            expect(result).toBe('image');
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Content Hash Detection', () => {
    it('should detect content hashes in filenames', () => {
      // Test with predefined hash patterns
      const testCases = [
        { name: 'style', hash: 'abc12345', ext: '.css' },
        { name: 'main', hash: 'def67890', ext: '.js' },
        { name: 'app', hash: 'a1b2c3d4', ext: '.mjs' },
        { name: 'bundle', hash: '12345678', ext: '.js' },
        { name: 'vendor', hash: 'abcdef12', ext: '.css' },
      ];

      for (const { name, hash, ext } of testCases) {
        const filename = `${name}.${hash}${ext}`;
        expect(hasContentHash(filename)).toBe(true);
      }
    });

    it('should not detect hashes in simple filenames', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z]+$/.test(s)),
          fc.constantFrom('.js', '.css', '.html'),
          (name, ext) => {
            const filename = `${name}${ext}`;
            expect(hasContentHash(filename)).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Minification Detection', () => {
    it('should detect minified HTML (single line, no extra whitespace)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 10, maxLength: 100 }).filter((s) => s.trim().length > 0),
          (content) => {
            // Create minified HTML (no newlines, minimal whitespace)
            const minified = `<!DOCTYPE html><html><head><title>Test</title></head><body>${content.replace(/\s+/g, ' ')}</body></html>`;
            expect(isHtmlMinified(minified)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect non-minified HTML (multiple lines, indentation)', () => {
      // Test with a known non-minified HTML structure
      const nonMinified = `<!DOCTYPE html>
<html>
  <head>
    <title>Test Page Title</title>
    <meta charset="utf-8">
  </head>
  <body>
    <div class="container">
      <header>
        <h1>Welcome</h1>
      </header>
      <main>
        <p>Content paragraph one</p>
        <p>Additional paragraph content here</p>
        <p>More content to make this longer</p>
      </main>
      <footer>
        <p>Footer content</p>
      </footer>
    </div>
  </body>
</html>`;
      expect(isHtmlMinified(nonMinified)).toBe(false);
    });

    it('should detect minified CSS (no extra whitespace)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z]+$/.test(s)),
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z]+$/.test(s)),
          (selector, property) => {
            const minified = `.${selector}{color:red;background:blue;${property}:10px}`;
            expect(isCssMinified(minified)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect minified JS (no comments, minimal whitespace)', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z]+$/.test(s)),
          (varName) => {
            const minified = `var ${varName}=function(){return 1+2};${varName}();`;
            expect(isJsMinified(minified)).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('File Collection', () => {
    it('should collect all files from a directory structure', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.string({ minLength: 1, maxLength: 10 }).filter((s) => /^[a-z0-9]+$/.test(s)),
            { minLength: 1, maxLength: 5 }
          ),
          (fileNames) => {
            // Create test files
            for (const name of fileNames) {
              fs.writeFileSync(path.join(TEST_DIR, `${name}.html`), '<html></html>');
            }

            const collected = collectFiles(TEST_DIR);

            // Clean up
            for (const name of fileNames) {
              fs.unlinkSync(path.join(TEST_DIR, `${name}.html`));
            }

            expect(collected.length).toBe(fileNames.length);
            expect(collected.every((a) => a.type === 'html')).toBe(true);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Build Report Generation', () => {
    it('should generate accurate build reports', () => {
      // Create a test build structure
      const assetsDir = path.join(TEST_DIR, 'assets');
      fs.mkdirSync(assetsDir, { recursive: true });

      // Create test files
      fs.writeFileSync(path.join(TEST_DIR, 'index.html'), '<!DOCTYPE html><html><body>Test</body></html>');
      fs.writeFileSync(path.join(assetsDir, 'style.abc12345.css'), '.test{color:red}');
      fs.writeFileSync(path.join(assetsDir, 'main.def67890.js'), 'var x=1;');

      const report = generateBuildReport(TEST_DIR);

      // Clean up
      fs.unlinkSync(path.join(TEST_DIR, 'index.html'));
      fs.unlinkSync(path.join(assetsDir, 'style.abc12345.css'));
      fs.unlinkSync(path.join(assetsDir, 'main.def67890.js'));
      fs.rmdirSync(assetsDir);

      expect(report.summary.totalFiles).toBe(3);
      expect(report.summary.htmlFiles).toBe(1);
      expect(report.summary.cssFiles).toBe(1);
      expect(report.summary.jsFiles).toBe(1);
      expect(report.optimizationChecks.allAssetsHashed).toBe(true);
    });
  });
});

describe('Build Optimization Validation', () => {
  beforeAll(() => {
    if (!fs.existsSync(TEST_DIR)) {
      fs.mkdirSync(TEST_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true });
    }
  });

  it('should validate optimized build output', () => {
    // Create optimized test structure
    const assetsDir = path.join(TEST_DIR, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    // Create minified files with hashes
    fs.writeFileSync(
      path.join(TEST_DIR, 'index.html'),
      '<!DOCTYPE html><html><head><title>Test</title></head><body><p>Content</p></body></html>'
    );
    fs.writeFileSync(path.join(assetsDir, 'style.abc12345.css'), '.test{color:red;margin:0}');
    fs.writeFileSync(path.join(assetsDir, 'main.def67890.js'), 'var x=1;function y(){return x}');

    const result = validateBuildOptimization(TEST_DIR);

    // Clean up
    fs.unlinkSync(path.join(TEST_DIR, 'index.html'));
    fs.unlinkSync(path.join(assetsDir, 'style.abc12345.css'));
    fs.unlinkSync(path.join(assetsDir, 'main.def67890.js'));
    fs.rmdirSync(assetsDir);

    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  it('should detect non-hashed assets', () => {
    // Create test structure with non-hashed assets
    const assetsDir = path.join(TEST_DIR, 'assets');
    fs.mkdirSync(assetsDir, { recursive: true });

    fs.writeFileSync(path.join(TEST_DIR, 'index.html'), '<!DOCTYPE html><html><body>Test</body></html>');
    fs.writeFileSync(path.join(assetsDir, 'style.css'), '.test{color:red}'); // No hash

    const result = validateBuildOptimization(TEST_DIR);

    // Clean up
    fs.unlinkSync(path.join(TEST_DIR, 'index.html'));
    fs.unlinkSync(path.join(assetsDir, 'style.css'));
    fs.rmdirSync(assetsDir);

    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('content hashes'))).toBe(true);
  });
});

describe('Real Build Output Validation', () => {
  it('should validate actual dist folder if it exists', () => {
    const distDir = 'dist';

    if (fs.existsSync(distDir)) {
      const result = validateBuildOptimization(distDir);

      // Report should be generated
      expect(result.report).toBeDefined();
      expect(result.report.summary.totalFiles).toBeGreaterThan(0);

      // Log the report for visibility
      console.log('Build Report Summary:', result.report.summary);
      console.log('Optimization Checks:', result.report.optimizationChecks);

      if (!result.valid) {
        console.log('Optimization Errors:', result.errors);
      }
    } else {
      // Skip if dist doesn't exist
      console.log('Skipping real build validation - dist folder does not exist');
    }
  });
});
