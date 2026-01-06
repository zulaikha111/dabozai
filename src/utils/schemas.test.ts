/**
 * Property-based tests for content schema validation
 * Feature: portfolio-training-website, Property 2: Content schema validation
 * Validates: Requirements 2.5, 6.2, 9.2, 10.2
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  productSchema,
  testimonialSchema,
  repositorySchema,
  publicationSchema,
  resumeFileSchema,
} from './schemas';

describe('Content Schema Validation - Property Tests', () => {
  /**
   * Property 2: Content schema validation
   * For any content file added to the system (products, testimonials, repositories, publications),
   * it should conform to the defined schema and be processed correctly during the build process
   */

  describe('Product Schema', () => {
    // Generator for valid product data
    const validProductArbitrary = fc.record({
      title: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.string({ minLength: 1, maxLength: 500 }),
      duration: fc.string({ minLength: 1, maxLength: 50 }),
      price: fc.option(fc.integer({ min: 1, max: 100000 }), { nil: undefined }),
      image: fc.string({ minLength: 1, maxLength: 200 }),
      featured: fc.boolean(),
      category: fc.string({ minLength: 1, maxLength: 50 }),
      prerequisites: fc.option(fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 10 }), { nil: undefined }),
      learningOutcomes: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
    });

    it('should validate any valid product data', () => {
      fc.assert(
        fc.property(validProductArbitrary, (product) => {
          const result = productSchema.safeParse(product);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject products with empty title', () => {
      fc.assert(
        fc.property(validProductArbitrary, (product) => {
          const invalidProduct = { ...product, title: '' };
          const result = productSchema.safeParse(invalidProduct);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject products with empty learningOutcomes', () => {
      fc.assert(
        fc.property(validProductArbitrary, (product) => {
          const invalidProduct = { ...product, learningOutcomes: [] };
          const result = productSchema.safeParse(invalidProduct);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Testimonial Schema', () => {
    // Generator for valid testimonial data
    const validTestimonialArbitrary = fc.record({
      id: fc.string({ minLength: 1, maxLength: 50 }),
      authorName: fc.string({ minLength: 1, maxLength: 100 }),
      courseSlug: fc.string({ minLength: 1, maxLength: 100 }),
      rating: fc.integer({ min: 1, max: 5 }),
      text: fc.string({ minLength: 1, maxLength: 1000 }),
      date: fc.string({ minLength: 1, maxLength: 20 }),
      verified: fc.boolean(),
    });

    it('should validate any valid testimonial data', () => {
      fc.assert(
        fc.property(validTestimonialArbitrary, (testimonial) => {
          const result = testimonialSchema.safeParse(testimonial);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject testimonials with rating outside 1-5 range', () => {
      fc.assert(
        fc.property(
          validTestimonialArbitrary,
          fc.oneof(fc.integer({ min: -100, max: 0 }), fc.integer({ min: 6, max: 100 })),
          (testimonial, invalidRating) => {
            const invalidTestimonial = { ...testimonial, rating: invalidRating };
            const result = testimonialSchema.safeParse(invalidTestimonial);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Repository Schema', () => {
    // Generator for valid repository data
    const validRepositoryArbitrary = fc.record({
      name: fc.string({ minLength: 1, maxLength: 100 }),
      description: fc.string({ minLength: 1, maxLength: 500 }),
      url: fc.webUrl(),
      technologies: fc.array(fc.string({ minLength: 1 }), { minLength: 0, maxLength: 10 }),
      featured: fc.boolean(),
      stars: fc.option(fc.integer({ min: 0, max: 1000000 }), { nil: undefined }),
    });

    it('should validate any valid repository data', () => {
      fc.assert(
        fc.property(validRepositoryArbitrary, (repository) => {
          const result = repositorySchema.safeParse(repository);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject repositories with invalid URL', () => {
      fc.assert(
        fc.property(validRepositoryArbitrary, (repository) => {
          const invalidRepository = { ...repository, url: 'not-a-valid-url' };
          const result = repositorySchema.safeParse(invalidRepository);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Publication Schema', () => {
    // Generator for valid publication data
    const validPublicationArbitrary = fc.record({
      title: fc.string({ minLength: 1, maxLength: 200 }),
      authors: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 10 }),
      venue: fc.string({ minLength: 1, maxLength: 200 }),
      year: fc.integer({ min: 1900, max: 2100 }),
      url: fc.option(fc.webUrl(), { nil: undefined }),
      downloadUrl: fc.option(fc.webUrl(), { nil: undefined }),
      abstract: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
    });

    it('should validate any valid publication data', () => {
      fc.assert(
        fc.property(validPublicationArbitrary, (publication) => {
          const result = publicationSchema.safeParse(publication);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject publications with empty authors array', () => {
      fc.assert(
        fc.property(validPublicationArbitrary, (publication) => {
          const invalidPublication = { ...publication, authors: [] };
          const result = publicationSchema.safeParse(invalidPublication);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject publications with year outside valid range', () => {
      fc.assert(
        fc.property(
          validPublicationArbitrary,
          fc.oneof(fc.integer({ min: -1000, max: 1899 }), fc.integer({ min: 2101, max: 3000 })),
          (publication, invalidYear) => {
            const invalidPublication = { ...publication, year: invalidYear };
            const result = publicationSchema.safeParse(invalidPublication);
            expect(result.success).toBe(false);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Resume Schema', () => {
    // Custom email generator that produces emails compatible with zod's validation
    // Ensures: starts with letter, no consecutive dots, no dot before @
    const zodCompatibleEmail = fc.tuple(
      fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
      fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
      fc.constantFrom('com', 'org', 'net', 'edu', 'io', 'dev')
    ).map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

    // Non-whitespace string generator
    const nonWhitespaceString = (maxLength: number) => 
      fc.stringMatching(new RegExp(`^[a-zA-Z][a-zA-Z0-9 ]{0,${maxLength - 1}}$`));

    // Generator for valid resume data
    const validResumeArbitrary = fc.record({
      personalInfo: fc.record({
        name: nonWhitespaceString(100),
        title: nonWhitespaceString(100),
        email: zodCompatibleEmail,
        phone: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        location: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
        summary: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
      }),
      experience: fc.option(
        fc.array(
          fc.record({
            company: fc.string({ minLength: 1, maxLength: 100 }),
            position: fc.string({ minLength: 1, maxLength: 100 }),
            startDate: fc.string({ minLength: 1, maxLength: 20 }),
            endDate: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            description: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            achievements: fc.option(fc.array(fc.string({ minLength: 1 })), { nil: undefined }),
          }),
          { minLength: 0, maxLength: 5 }
        ),
        { nil: undefined }
      ),
      certifications: fc.option(
        fc.array(
          fc.record({
            name: fc.string({ minLength: 1, maxLength: 100 }),
            issuer: fc.string({ minLength: 1, maxLength: 100 }),
            date: fc.string({ minLength: 1, maxLength: 20 }),
            credentialId: fc.option(fc.string({ minLength: 1 }), { nil: undefined }),
            credentialUrl: fc.option(fc.webUrl(), { nil: undefined }),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        { nil: undefined }
      ),
      skills: fc.option(
        fc.array(
          fc.record({
            category: fc.string({ minLength: 1, maxLength: 50 }),
            items: fc.array(fc.string({ minLength: 1 }), { minLength: 1, maxLength: 20 }),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        { nil: undefined }
      ),
    });

    it('should validate any valid resume data', () => {
      fc.assert(
        fc.property(validResumeArbitrary, (resume) => {
          const result = resumeFileSchema.safeParse(resume);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should reject resume with invalid email', () => {
      fc.assert(
        fc.property(validResumeArbitrary, (resume) => {
          const invalidResume = {
            ...resume,
            personalInfo: { ...resume.personalInfo, email: 'not-an-email' },
          };
          const result = resumeFileSchema.safeParse(invalidResume);
          expect(result.success).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});
