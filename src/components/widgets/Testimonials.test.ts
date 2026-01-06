/**
 * Property-based tests for Testimonials component
 * Feature: portfolio-training-website
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { calculateAverageRating, getTestimonialsForCourse } from '../../utils/dataLoader';

/**
 * Property 12: Testimonial rating calculation
 * For any training product with multiple testimonials, the displayed average rating
 * should accurately reflect the mathematical average of all testimonial ratings for that product
 * Validates: Requirements 10.4
 */
describe('Property 12: Testimonial rating calculation', () => {
  // Generator for valid date strings in YYYY-MM-DD format
  const dateStringArbitrary = fc
    .tuple(fc.integer({ min: 2020, max: 2025 }), fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 28 }))
    .map(([year, month, day]) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);

  // Generator for valid testimonial data
  const testimonialArbitrary = fc.record({
    id: fc.uuid(),
    authorName: fc.string({ minLength: 1, maxLength: 100 }),
    courseSlug: fc.string({ minLength: 1, maxLength: 50 }),
    rating: fc.integer({ min: 1, max: 5 }),
    text: fc.string({ minLength: 1, maxLength: 500 }),
    date: dateStringArbitrary,
    verified: fc.boolean(),
  });

  it('should calculate average rating as mathematical mean of all ratings for a course', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 20 }),
        (courseSlug, ratings) => {
          // Create testimonials with the given ratings
          const testimonials = ratings.map((rating, index) => ({
            id: `test-${index}`,
            authorName: `Author ${index}`,
            courseSlug,
            rating,
            text: 'Test testimonial',
            date: '2024-01-01',
            verified: true,
          }));

          const calculatedAverage = calculateAverageRating(testimonials, courseSlug);
          const expectedAverage = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
          const roundedExpected = Math.round(expectedAverage * 10) / 10;

          expect(calculatedAverage).toBe(roundedExpected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return null for courses with no testimonials', () => {
    fc.assert(
      fc.property(
        fc.array(testimonialArbitrary, { minLength: 0, maxLength: 10 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        (testimonials, nonExistentCourse) => {
          // Ensure the course slug doesn't exist in testimonials
          const filteredTestimonials = testimonials.filter((t) => t.courseSlug !== nonExistentCourse);
          const result = calculateAverageRating(filteredTestimonials, nonExistentCourse);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return exact rating for courses with single testimonial', () => {
    fc.assert(
      fc.property(testimonialArbitrary, (testimonial) => {
        const testimonials = [testimonial];
        const result = calculateAverageRating(testimonials, testimonial.courseSlug);
        expect(result).toBe(testimonial.rating);
      }),
      { numRuns: 100 }
    );
  });

  it('should calculate average only from testimonials matching the course slug', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 10 }),
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 10 }),
        (courseA, courseB, ratingsA, ratingsB) => {
          // Ensure course slugs are different
          const actualCourseB = courseA === courseB ? `${courseB}-different` : courseB;

          const testimonialsA = ratingsA.map((rating, i) => ({
            id: `a-${i}`,
            authorName: `Author A${i}`,
            courseSlug: courseA,
            rating,
            text: 'Test',
            date: '2024-01-01',
            verified: true,
          }));

          const testimonialsB = ratingsB.map((rating, i) => ({
            id: `b-${i}`,
            authorName: `Author B${i}`,
            courseSlug: actualCourseB,
            rating,
            text: 'Test',
            date: '2024-01-01',
            verified: true,
          }));

          const allTestimonials = [...testimonialsA, ...testimonialsB];

          // Calculate average for course A
          const avgA = calculateAverageRating(allTestimonials, courseA);
          const expectedAvgA = Math.round((ratingsA.reduce((s, r) => s + r, 0) / ratingsA.length) * 10) / 10;

          expect(avgA).toBe(expectedAvgA);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce average rating between 1 and 5 inclusive', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(fc.integer({ min: 1, max: 5 }), { minLength: 1, maxLength: 20 }),
        (courseSlug, ratings) => {
          const testimonials = ratings.map((rating, index) => ({
            id: `test-${index}`,
            authorName: `Author ${index}`,
            courseSlug,
            rating,
            text: 'Test',
            date: '2024-01-01',
            verified: true,
          }));

          const avg = calculateAverageRating(testimonials, courseSlug);
          expect(avg).toBeGreaterThanOrEqual(1);
          expect(avg).toBeLessThanOrEqual(5);
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Property 13: Testimonial data completeness
 * For any testimonial in the system, all required fields (author name, rating, text, course association)
 * should be displayed correctly on the relevant product page
 * Validates: Requirements 10.3
 */
describe('Property 13: Testimonial data completeness', () => {
  // Generator for valid date strings in YYYY-MM-DD format
  const dateStringArbitrary = fc
    .tuple(fc.integer({ min: 2020, max: 2025 }), fc.integer({ min: 1, max: 12 }), fc.integer({ min: 1, max: 28 }))
    .map(([year, month, day]) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);

  // Generator for valid testimonial data
  const testimonialArbitrary = fc.record({
    id: fc.uuid(),
    authorName: fc.string({ minLength: 1, maxLength: 100 }),
    courseSlug: fc.string({ minLength: 1, maxLength: 50 }),
    rating: fc.integer({ min: 1, max: 5 }),
    text: fc.string({ minLength: 1, maxLength: 500 }),
    date: dateStringArbitrary,
    verified: fc.boolean(),
  });

  it('should filter testimonials correctly by course slug', () => {
    fc.assert(
      fc.property(fc.array(testimonialArbitrary, { minLength: 1, maxLength: 20 }), (testimonials) => {
        // Pick a random course slug from the testimonials
        const targetCourse = testimonials[0].courseSlug;
        const filtered = getTestimonialsForCourse(testimonials, targetCourse);

        // All filtered testimonials should have the target course slug
        expect(filtered.every((t) => t.courseSlug === targetCourse)).toBe(true);

        // Count should match manual filter
        const expectedCount = testimonials.filter((t) => t.courseSlug === targetCourse).length;
        expect(filtered.length).toBe(expectedCount);
      }),
      { numRuns: 100 }
    );
  });

  it('should preserve all required fields when filtering testimonials', () => {
    fc.assert(
      fc.property(fc.array(testimonialArbitrary, { minLength: 1, maxLength: 20 }), (testimonials) => {
        const targetCourse = testimonials[0].courseSlug;
        const filtered = getTestimonialsForCourse(testimonials, targetCourse);

        // Each filtered testimonial should have all required fields
        filtered.forEach((t) => {
          expect(t.id).toBeDefined();
          expect(t.authorName).toBeDefined();
          expect(t.authorName.length).toBeGreaterThan(0);
          expect(t.courseSlug).toBe(targetCourse);
          expect(t.rating).toBeGreaterThanOrEqual(1);
          expect(t.rating).toBeLessThanOrEqual(5);
          expect(t.text).toBeDefined();
          expect(t.text.length).toBeGreaterThan(0);
          expect(t.date).toBeDefined();
          expect(typeof t.verified).toBe('boolean');
        });
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty array for non-existent course', () => {
    fc.assert(
      fc.property(
        fc.array(testimonialArbitrary, { minLength: 0, maxLength: 10 }),
        fc.uuid(),
        (testimonials, nonExistentCourse) => {
          // Filter out any testimonials that might accidentally match
          const filteredTestimonials = testimonials.filter((t) => t.courseSlug !== nonExistentCourse);
          const result = getTestimonialsForCourse(filteredTestimonials, nonExistentCourse);
          expect(result).toEqual([]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should maintain testimonial order when filtering', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(testimonialArbitrary, { minLength: 2, maxLength: 10 }),
        (courseSlug, baseTestimonials) => {
          // Create testimonials with same course slug
          const testimonials = baseTestimonials.map((t, i) => ({
            ...t,
            courseSlug,
            id: `ordered-${i}`,
          }));

          const filtered = getTestimonialsForCourse(testimonials, courseSlug);

          // Order should be preserved
          for (let i = 0; i < filtered.length; i++) {
            expect(filtered[i].id).toBe(`ordered-${i}`);
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});
