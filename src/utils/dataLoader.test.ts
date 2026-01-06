/**
 * Unit tests for data file loading utilities
 * Validates: Requirements 6.3
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  loadResumeData,
  loadRepositoriesData,
  loadPublicationsData,
  loadTestimonialsData,
  calculateAverageRating,
  getTestimonialsForCourse,
  loadYamlFile,
} from './dataLoader';
import { z } from 'zod';

const TEST_DATA_DIR = 'src/data/test-fixtures';

describe('Data File Loading', () => {
  beforeAll(() => {
    // Create test fixtures directory
    if (!fs.existsSync(TEST_DATA_DIR)) {
      fs.mkdirSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test fixtures
    if (fs.existsSync(TEST_DATA_DIR)) {
      fs.rmSync(TEST_DATA_DIR, { recursive: true });
    }
  });

  describe('loadResumeData', () => {
    it('should load valid resume data from the default file', () => {
      const result = loadResumeData();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.personalInfo.name).toBeDefined();
      expect(result.data?.personalInfo.email).toBeDefined();
    });

    it('should return error for non-existent file', () => {
      const result = loadResumeData('non-existent-file.yaml');
      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });
  });

  describe('loadRepositoriesData', () => {
    it('should load valid repositories data from the default file', () => {
      const result = loadRepositoriesData();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.repositories).toBeInstanceOf(Array);
      expect(result.data?.repositories.length).toBeGreaterThan(0);
    });

    it('should validate repository structure', () => {
      const result = loadRepositoriesData();
      expect(result.success).toBe(true);
      
      if (result.data) {
        result.data.repositories.forEach(repo => {
          expect(repo.name).toBeDefined();
          expect(repo.description).toBeDefined();
          expect(repo.url).toBeDefined();
          expect(repo.technologies).toBeInstanceOf(Array);
        });
      }
    });
  });

  describe('loadPublicationsData', () => {
    it('should load valid publications data from the default file', () => {
      const result = loadPublicationsData();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.publications).toBeInstanceOf(Array);
    });

    it('should validate publication structure', () => {
      const result = loadPublicationsData();
      expect(result.success).toBe(true);
      
      if (result.data) {
        result.data.publications.forEach(pub => {
          expect(pub.title).toBeDefined();
          expect(pub.authors).toBeInstanceOf(Array);
          expect(pub.authors.length).toBeGreaterThan(0);
          expect(pub.venue).toBeDefined();
          expect(pub.year).toBeGreaterThanOrEqual(1900);
        });
      }
    });
  });

  describe('loadTestimonialsData', () => {
    it('should load valid testimonials data from the default file', () => {
      const result = loadTestimonialsData();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.testimonials).toBeInstanceOf(Array);
    });

    it('should validate testimonial ratings are within 1-5 range', () => {
      const result = loadTestimonialsData();
      expect(result.success).toBe(true);
      
      if (result.data) {
        result.data.testimonials.forEach(testimonial => {
          expect(testimonial.rating).toBeGreaterThanOrEqual(1);
          expect(testimonial.rating).toBeLessThanOrEqual(5);
        });
      }
    });
  });

  describe('Error handling for malformed data', () => {
    it('should return error for malformed YAML', () => {
      const malformedPath = path.join(TEST_DATA_DIR, 'malformed.yaml');
      fs.writeFileSync(malformedPath, 'invalid: yaml: content: [unclosed');
      
      const result = loadYamlFile(malformedPath, z.object({ test: z.string() }));
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should return error for schema validation failure', () => {
      const invalidPath = path.join(TEST_DATA_DIR, 'invalid-testimonial.yaml');
      fs.writeFileSync(invalidPath, `
testimonials:
  - id: "test"
    authorName: "Test"
    courseSlug: "test-course"
    rating: 10
    text: "Test text"
    date: "2024-01-01"
    verified: true
`);
      
      const result = loadTestimonialsData(invalidPath);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Schema validation failed');
    });
  });

  describe('calculateAverageRating', () => {
    const mockTestimonials = [
      { id: '1', authorName: 'A', courseSlug: 'course-1', rating: 5, text: 'Great', date: '2024-01-01', verified: true },
      { id: '2', authorName: 'B', courseSlug: 'course-1', rating: 4, text: 'Good', date: '2024-01-02', verified: true },
      { id: '3', authorName: 'C', courseSlug: 'course-1', rating: 3, text: 'OK', date: '2024-01-03', verified: true },
      { id: '4', authorName: 'D', courseSlug: 'course-2', rating: 5, text: 'Excellent', date: '2024-01-04', verified: true },
    ];

    it('should calculate correct average rating for a course', () => {
      const average = calculateAverageRating(mockTestimonials, 'course-1');
      expect(average).toBe(4); // (5 + 4 + 3) / 3 = 4
    });

    it('should return null for course with no testimonials', () => {
      const average = calculateAverageRating(mockTestimonials, 'non-existent-course');
      expect(average).toBeNull();
    });

    it('should return exact rating for course with single testimonial', () => {
      const average = calculateAverageRating(mockTestimonials, 'course-2');
      expect(average).toBe(5);
    });
  });

  describe('getTestimonialsForCourse', () => {
    const mockTestimonials = [
      { id: '1', authorName: 'A', courseSlug: 'course-1', rating: 5, text: 'Great', date: '2024-01-01', verified: true },
      { id: '2', authorName: 'B', courseSlug: 'course-1', rating: 4, text: 'Good', date: '2024-01-02', verified: true },
      { id: '3', authorName: 'C', courseSlug: 'course-2', rating: 5, text: 'Excellent', date: '2024-01-03', verified: true },
    ];

    it('should return only testimonials for the specified course', () => {
      const result = getTestimonialsForCourse(mockTestimonials, 'course-1');
      expect(result.length).toBe(2);
      expect(result.every(t => t.courseSlug === 'course-1')).toBe(true);
    });

    it('should return empty array for course with no testimonials', () => {
      const result = getTestimonialsForCourse(mockTestimonials, 'non-existent');
      expect(result).toEqual([]);
    });
  });
});
