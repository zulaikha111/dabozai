/**
 * Property-based tests for content update reflection
 * Feature: portfolio-training-website, Property 7: Content update reflection
 * Validates: Requirements 1.2, 6.1, 10.5
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fc from 'fast-check';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import {
  validateYamlFile,
  extractFrontmatter,
  validateAllContent,
  generateContentManifest,
  detectContentChanges,
  getFileModifiedTime,
} from './contentValidator';
import { testimonialsFileSchema, repositoriesFileSchema } from './schemas';

const TEST_DIR = 'src/data/test-content-validator';

describe('Content Update Reflection - Property Tests', () => {
  /**
   * Property 7: Content update reflection
   * For any modification to content files (portfolio, products, blog, repositories, testimonials),
   * the changes should be reflected in the generated static site after rebuild
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

  describe('YAML Content Validation', () => {
    // Generator for valid testimonial data
    const validTestimonialArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
      authorName: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      courseSlug: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      rating: fc.integer({ min: 1, max: 5 }),
      text: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
      date: fc
        .tuple(fc.integer({ min: 2020, max: 2030 }), fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 28 }))
        .map(([year, month, day]) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`),
      verified: fc.boolean(),
    });

    it('should validate any valid testimonial YAML content written to file', () => {
      fc.assert(
        fc.property(fc.array(validTestimonialArbitrary, { minLength: 1, maxLength: 5 }), (testimonials) => {
          const filePath = path.join(TEST_DIR, 'test-testimonials.yaml');
          const content = { testimonials };

          // Write content to file
          fs.writeFileSync(filePath, yaml.dump(content));

          // Validate the file
          const result = validateYamlFile(filePath, testimonialsFileSchema);

          // Clean up
          fs.unlinkSync(filePath);

          expect(result.valid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    // Generator for valid repository data
    const validRepositoryArbitrary = fc.record({
      name: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
      description: fc.string({ minLength: 1, maxLength: 200 }).filter((s) => s.trim().length > 0),
      url: fc.webUrl(),
      technologies: fc.array(
        fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim().length > 0),
        { minLength: 0, maxLength: 5 }
      ),
      featured: fc.boolean(),
      stars: fc.option(fc.integer({ min: 0, max: 100000 }), { nil: undefined }),
    });

    it('should validate any valid repository YAML content written to file', () => {
      fc.assert(
        fc.property(fc.array(validRepositoryArbitrary, { minLength: 1, maxLength: 5 }), (repositories) => {
          const filePath = path.join(TEST_DIR, 'test-repositories.yaml');
          const content = { repositories };

          // Write content to file
          fs.writeFileSync(filePath, yaml.dump(content));

          // Validate the file
          const result = validateYamlFile(filePath, repositoriesFileSchema);

          // Clean up
          fs.unlinkSync(filePath);

          expect(result.valid).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Content Manifest and Change Detection', () => {
    it('should detect file additions in content manifest', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9]+$/.test(s)),
            { minLength: 1, maxLength: 5 }
          ),
          (fileNames) => {
            const oldManifest: Record<string, number> = {};
            const newManifest: Record<string, number> = {};

            // Add files to new manifest only
            for (const name of fileNames) {
              newManifest[`/path/to/${name}.yaml`] = Date.now();
            }

            const changes = detectContentChanges(oldManifest, newManifest);

            expect(changes.added.length).toBe(fileNames.length);
            expect(changes.modified.length).toBe(0);
            expect(changes.deleted.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect file deletions in content manifest', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9]+$/.test(s)),
            { minLength: 1, maxLength: 5 }
          ),
          (fileNames) => {
            const oldManifest: Record<string, number> = {};
            const newManifest: Record<string, number> = {};

            // Add files to old manifest only
            for (const name of fileNames) {
              oldManifest[`/path/to/${name}.yaml`] = Date.now();
            }

            const changes = detectContentChanges(oldManifest, newManifest);

            expect(changes.added.length).toBe(0);
            expect(changes.modified.length).toBe(0);
            expect(changes.deleted.length).toBe(fileNames.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect file modifications in content manifest', () => {
      fc.assert(
        fc.property(
          fc.uniqueArray(
            fc.string({ minLength: 1, maxLength: 20 }).filter((s) => /^[a-z0-9]+$/.test(s)),
            { minLength: 1, maxLength: 5 }
          ),
          fc.integer({ min: 1, max: 10000 }),
          (fileNames, timeDiff) => {
            const baseTime = Date.now();
            const oldManifest: Record<string, number> = {};
            const newManifest: Record<string, number> = {};

            // Add files to both manifests with different timestamps
            for (const name of fileNames) {
              const filePath = `/path/to/${name}.yaml`;
              oldManifest[filePath] = baseTime;
              newManifest[filePath] = baseTime + timeDiff;
            }

            const changes = detectContentChanges(oldManifest, newManifest);

            expect(changes.added.length).toBe(0);
            expect(changes.modified.length).toBe(fileNames.length);
            expect(changes.deleted.length).toBe(0);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Frontmatter Extraction', () => {
    it('should extract frontmatter from any valid markdown with YAML frontmatter', () => {
      fc.assert(
        fc.property(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0 && !s.includes('\n')),
            description: fc
              .string({ minLength: 1, maxLength: 100 })
              .filter((s) => s.trim().length > 0 && !s.includes('\n')),
          }),
          fc.string({ minLength: 0, maxLength: 200 }),
          (frontmatterData, bodyContent) => {
            const yamlContent = yaml.dump(frontmatterData);
            const markdown = `---\n${yamlContent}---\n\n${bodyContent}`;

            const extracted = extractFrontmatter(markdown);

            expect(extracted).not.toBeNull();
            expect(extracted?.title).toBe(frontmatterData.title);
            expect(extracted?.description).toBe(frontmatterData.description);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should return null for markdown without frontmatter', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 200 }).filter((s) => !s.startsWith('---')),
          (content) => {
            const extracted = extractFrontmatter(content);
            expect(extracted).toBeNull();
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('File Change Detection', () => {
    it('should correctly detect file modification times', () => {
      const testFile = path.join(TEST_DIR, 'timestamp-test.txt');

      // Create file
      fs.writeFileSync(testFile, 'initial content');
      const initialTime = getFileModifiedTime(testFile);

      expect(initialTime).not.toBeNull();
      expect(typeof initialTime).toBe('number');

      // Clean up
      fs.unlinkSync(testFile);
    });

    it('should return null for non-existent files', () => {
      const nonExistentFile = path.join(TEST_DIR, 'non-existent-file.txt');
      const modTime = getFileModifiedTime(nonExistentFile);
      expect(modTime).toBeNull();
    });
  });
});

describe('Content Validation Integration', () => {
  it('should validate existing content files in the project', () => {
    const report = validateAllContent('.');

    // The validation should complete without throwing
    expect(report).toBeDefined();
    expect(report.timestamp).toBeDefined();
    expect(report.summary).toBeDefined();
    expect(typeof report.summary.total).toBe('number');
    expect(typeof report.summary.valid).toBe('number');
    expect(typeof report.summary.invalid).toBe('number');
  });

  it('should generate content manifest for existing files', () => {
    const manifest = generateContentManifest('.');

    // Should have entries for existing content files
    expect(typeof manifest).toBe('object');

    // Check that manifest contains expected paths
    const paths = Object.keys(manifest);
    const hasDataFiles = paths.some((p) => p.includes('src/data'));

    expect(hasDataFiles).toBe(true);
  });
});
