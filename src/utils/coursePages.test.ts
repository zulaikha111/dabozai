/**
 * Tests for course data files validation and services page links
 * Feature: ai-course-detail-page
 * Validates: Requirements 1.1, 1.2, 2.1, 2.2, 3.1, 3.2, 4.1, 4.2, 4.3, 4.4, 7.1, 7.2, 7.3
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { productSchema } from './schemas';

// Expected course slugs that must exist in the products collection
const EXPECTED_COURSE_SLUGS = ['ai-systems-from-prompts-to-agents'];

// Expected course links mapping slug to expected href
const EXPECTED_COURSE_LINKS: Record<string, string> = {
  'ai-systems-from-prompts-to-agents': '/products/ai-systems-from-prompts-to-agents',
  'building-ai-agents': '/products/building-ai-agents',
  'rag-systems-masterclass': '/products/rag-systems-masterclass',
};

const PRODUCTS_DIR = path.join(process.cwd(), 'src/data/products');
const SERVICES_PAGE_PATH = path.join(process.cwd(), 'src/pages/services.astro');

/**
 * Helper function to parse frontmatter from markdown file
 */
function parseFrontmatter(content: string): Record<string, unknown> | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!frontmatterMatch) return null;

  const frontmatterStr = frontmatterMatch[1];
  const result: Record<string, unknown> = {};

  // Parse YAML-like frontmatter
  const lines = frontmatterStr.split('\n');
  let currentKey = '';
  let currentArray: string[] = [];
  let inArray = false;

  for (const line of lines) {
    // Check for array item
    if (line.match(/^\s+-\s+/)) {
      const value = line
        .replace(/^\s+-\s+['"]?/, '')
        .replace(/['"]?$/, '')
        .trim();
      currentArray.push(value);
      continue;
    }

    // If we were in an array, save it
    if (inArray && currentKey) {
      result[currentKey] = currentArray;
      currentArray = [];
      inArray = false;
    }

    // Check for key-value pair
    const keyValueMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyValueMatch) {
      const [, key, value] = keyValueMatch;
      currentKey = key;

      if (value === '' || value === undefined) {
        // This is an array start
        inArray = true;
        currentArray = [];
      } else {
        // Parse the value
        let parsedValue: unknown = value.replace(/^['"]|['"]$/g, '');

        // Handle booleans
        if (parsedValue === 'true') parsedValue = true;
        else if (parsedValue === 'false') parsedValue = false;
        // Handle numbers
        else if (!isNaN(Number(parsedValue)) && parsedValue !== '') {
          parsedValue = Number(parsedValue);
        }

        result[key] = parsedValue;
      }
    }
  }

  // Handle final array if file ends with array
  if (inArray && currentKey) {
    result[currentKey] = currentArray;
  }

  return result;
}

/**
 * Helper function to read and parse a course file
 */
function readCourseFile(slug: string): { exists: boolean; frontmatter: Record<string, unknown> | null } {
  const filePath = path.join(PRODUCTS_DIR, `${slug}.md`);

  if (!fs.existsSync(filePath)) {
    return { exists: false, frontmatter: null };
  }

  const content = fs.readFileSync(filePath, 'utf-8');
  const frontmatter = parseFrontmatter(content);

  return { exists: true, frontmatter };
}

/**
 * Helper function to extract course links from services page
 * Returns array of href values found in callToAction objects
 */
function extractCourseLinksFromServicesPage(): string[] {
  const content = fs.readFileSync(SERVICES_PAGE_PATH, 'utf-8');

  // Extract all href values from callToAction objects in the Features2 items
  const hrefMatches = content.match(/href:\s*['"]([^'"]+)['"]/g);

  if (!hrefMatches) return [];

  // Filter to only include /products/ links (course detail pages)
  return hrefMatches
    .map((match) => {
      const hrefMatch = match.match(/href:\s*['"]([^'"]+)['"]/);
      return hrefMatch ? hrefMatch[1] : null;
    })
    .filter((href): href is string => href !== null && href.startsWith('/products/'));
}

describe('Course Data Files - Unit Tests', () => {
  /**
   * Test that all three course files exist
   * Requirements: 7.1
   */
  describe('Course File Existence', () => {
    it('should have ai-systems-from-prompts-to-agents.md file', () => {
      const { exists } = readCourseFile('ai-systems-from-prompts-to-agents');
      expect(exists).toBe(true);
    });

    it('should have building-ai-agents.md file', () => {
      const { exists } = readCourseFile('building-ai-agents');
      expect(exists).toBe(true);
    });

    it('should have rag-systems-masterclass.md file', () => {
      const { exists } = readCourseFile('rag-systems-masterclass');
      expect(exists).toBe(true);
    });
  });

  /**
   * Test frontmatter schema compliance
   * Requirements: 7.3
   */
  describe('Frontmatter Schema Compliance', () => {
    it('ai-systems-from-prompts-to-agents should have valid frontmatter', () => {
      const { frontmatter } = readCourseFile('ai-systems-from-prompts-to-agents');
      expect(frontmatter).not.toBeNull();
      const result = productSchema.safeParse(frontmatter);
      expect(result.success).toBe(true);
    });

    it('building-ai-agents should have valid frontmatter', () => {
      const { frontmatter } = readCourseFile('building-ai-agents');
      expect(frontmatter).not.toBeNull();
      const result = productSchema.safeParse(frontmatter);
      expect(result.success).toBe(true);
    });

    it('rag-systems-masterclass should have valid frontmatter', () => {
      const { frontmatter } = readCourseFile('rag-systems-masterclass');
      expect(frontmatter).not.toBeNull();
      const result = productSchema.safeParse(frontmatter);
      expect(result.success).toBe(true);
    });
  });

  /**
   * Test services page course links
   * Requirements: 7.2
   */
  describe('Services Page Course Links', () => {
    it('should have link to ai-systems-from-prompts-to-agents course', () => {
      const links = extractCourseLinksFromServicesPage();
      expect(links).toContain('/products/ai-systems-from-prompts-to-agents');
    });

    it('should have exactly three course links', () => {
      const links = extractCourseLinksFromServicesPage();
      expect(links).toHaveLength(1);
    });
  });
});

describe('Course Data Files - Property Tests', () => {
  /**
   * Property 1: Course Files Exist in Collection
   * For all expected course slugs, the products collection SHALL contain a corresponding markdown file.
   * Feature: ai-course-detail-page, Property 1: Course Files Exist in Collection
   * Validates: Requirements 1.1, 2.1, 3.1
   */
  describe('Property 1: Course Files Exist in Collection', () => {
    it('for all expected course slugs, a corresponding markdown file should exist', () => {
      // Generator that produces expected course slugs
      const courseSlugArbitrary = fc.constantFrom(...EXPECTED_COURSE_SLUGS);

      fc.assert(
        fc.property(courseSlugArbitrary, (slug) => {
          const filePath = path.join(PRODUCTS_DIR, `${slug}.md`);
          const exists = fs.existsSync(filePath);
          expect(exists).toBe(true);
          return exists;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 2: Course Frontmatter Schema Compliance
   * For all course files in the products collection, the frontmatter SHALL contain all required fields.
   * Feature: ai-course-detail-page, Property 2: Course Frontmatter Schema Compliance
   * Validates: Requirements 1.2, 2.2, 3.2
   */
  describe('Property 2: Course Frontmatter Schema Compliance', () => {
    it('for all course files, frontmatter should contain required fields and pass schema validation', () => {
      // Generator that produces expected course slugs
      const courseSlugArbitrary = fc.constantFrom(...EXPECTED_COURSE_SLUGS);

      fc.assert(
        fc.property(courseSlugArbitrary, (slug) => {
          const { exists, frontmatter } = readCourseFile(slug);

          // File must exist
          expect(exists).toBe(true);

          // Frontmatter must be parseable
          expect(frontmatter).not.toBeNull();

          // Required fields must be present
          expect(frontmatter).toHaveProperty('title');
          expect(frontmatter).toHaveProperty('description');
          expect(frontmatter).toHaveProperty('duration');
          expect(frontmatter).toHaveProperty('image');
          expect(frontmatter).toHaveProperty('category');
          expect(frontmatter).toHaveProperty('learningOutcomes');

          // Frontmatter must pass schema validation
          const result = productSchema.safeParse(frontmatter);
          expect(result.success).toBe(true);

          return result.success;
        }),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 3: Services Page Course Links
   * For all courses displayed on the services page, the course card SHALL contain an href attribute
   * matching the pattern /products/{course-slug}.
   * Feature: ai-course-detail-page, Property 3: Services Page Course Links
   * Validates: Requirements 4.1, 4.2, 4.3, 4.4
   */
  describe('Property 3: Services Page Course Links', () => {
    it('for all expected course slugs, the services page should contain a link to /products/{slug}', () => {
      // Generator that produces expected course slugs
      const courseSlugArbitrary = fc.constantFrom(...EXPECTED_COURSE_SLUGS);

      // Get all links from services page once
      const servicesPageLinks = extractCourseLinksFromServicesPage();

      fc.assert(
        fc.property(courseSlugArbitrary, (slug) => {
          const expectedHref = EXPECTED_COURSE_LINKS[slug];

          // The services page must contain a link to this course
          const hasLink = servicesPageLinks.includes(expectedHref);
          expect(hasLink).toBe(true);

          // The link must match the expected pattern /products/{slug}
          expect(expectedHref).toMatch(/^\/products\/[\w-]+$/);

          return hasLink;
        }),
        { numRuns: 100 }
      );
    });
  });
});
