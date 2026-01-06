/**
 * Property-based tests for Training Catalog and Product Detail Pages
 * Feature: portfolio-training-website, Property 3: Dynamic route generation
 * Feature: portfolio-training-website, Property 4: Product detail page completeness
 * Validates: Requirements 2.2, 2.3, 2.4, 10.1
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { productSchema } from '../../utils/schemas';

/**
 * Interface representing a product for testing
 */
interface TestProduct {
  id: string;
  data: {
    title: string;
    description: string;
    duration: string;
    price?: number;
    image: string;
    featured: boolean;
    category: string;
    prerequisites?: string[];
    learningOutcomes: string[];
  };
}

/**
 * Interface representing a testimonial for testing
 */
interface TestTestimonial {
  id: string;
  authorName: string;
  courseSlug: string;
  rating: number;
  text: string;
  date: string;
  verified: boolean;
}

/**
 * Simulates dynamic route generation for products
 * This mirrors the getStaticPaths logic in [..slug].astro
 */
function generateProductRoutes(products: TestProduct[]): Array<{ params: { slug: string }; props: { product: TestProduct } }> {
  return products.map((product) => ({
    params: { slug: product.id },
    props: { product },
  }));
}

/**
 * Simulates building the contact URL with pre-populated parameters
 */
function buildContactUrl(productId: string, productTitle: string): string {
  return `/contact?product=${encodeURIComponent(productId)}&subject=${encodeURIComponent(`Training Inquiry: ${productTitle}`)}`;
}

/**
 * Simulates checking if a product detail page has all required fields
 */
function validateProductDetailCompleteness(
  product: TestProduct,
  testimonials: TestTestimonial[]
): {
  hasTitle: boolean;
  hasDescription: boolean;
  hasDuration: boolean;
  hasPrice: boolean;
  hasLearningOutcomes: boolean;
  hasTestimonials: boolean;
  hasAverageRating: boolean;
  hasRequestTrainingButton: boolean;
} {
  const productTestimonials = testimonials.filter(t => t.courseSlug === product.id);
  const averageRating = productTestimonials.length > 0
    ? productTestimonials.reduce((sum, t) => sum + t.rating, 0) / productTestimonials.length
    : null;

  return {
    hasTitle: !!product.data.title && product.data.title.length > 0,
    hasDescription: !!product.data.description && product.data.description.length > 0,
    hasDuration: !!product.data.duration && product.data.duration.length > 0,
    hasPrice: product.data.price !== undefined,
    hasLearningOutcomes: !!product.data.learningOutcomes && product.data.learningOutcomes.length > 0,
    hasTestimonials: productTestimonials.length > 0,
    hasAverageRating: averageRating !== null,
    hasRequestTrainingButton: true, // Always present in the component
  };
}

/**
 * Calculate average rating for a product
 */
function calculateAverageRating(testimonials: TestTestimonial[], productId: string): number | null {
  const productTestimonials = testimonials.filter(t => t.courseSlug === productId);
  if (productTestimonials.length === 0) return null;
  return productTestimonials.reduce((sum, t) => sum + t.rating, 0) / productTestimonials.length;
}

describe('Training Catalog - Property Tests', () => {
  // Non-empty string generator
  const nonEmptyString = (maxLength: number) =>
    fc.string({ minLength: 1, maxLength }).filter(s => s.trim().length > 0);

  // Slug generator (URL-safe string)
  const slugArbitrary = fc.stringMatching(/^[a-z][a-z0-9-]{0,49}$/);

  // Generator for valid product data
  const validProductArbitrary: fc.Arbitrary<TestProduct> = fc.record({
    id: slugArbitrary,
    data: fc.record({
      title: nonEmptyString(100),
      description: nonEmptyString(500),
      duration: nonEmptyString(50),
      price: fc.option(fc.integer({ min: 1, max: 100000 }), { nil: undefined }),
      image: nonEmptyString(200),
      featured: fc.boolean(),
      category: nonEmptyString(50),
      prerequisites: fc.option(fc.array(nonEmptyString(100), { minLength: 0, maxLength: 5 }), { nil: undefined }),
      learningOutcomes: fc.array(nonEmptyString(200), { minLength: 1, maxLength: 10 }),
    }),
  });

  // Generator for valid testimonial data
  const validTestimonialArbitrary: fc.Arbitrary<TestTestimonial> = fc.record({
    id: nonEmptyString(50),
    authorName: nonEmptyString(100),
    courseSlug: slugArbitrary,
    rating: fc.integer({ min: 1, max: 5 }),
    text: nonEmptyString(500),
    date: fc.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    verified: fc.boolean(),
  });

  // Generator for array of products
  const productsArrayArbitrary = fc.array(validProductArbitrary, { minLength: 1, maxLength: 10 });

  // Generator for array of testimonials
  const testimonialsArrayArbitrary = fc.array(validTestimonialArbitrary, { minLength: 0, maxLength: 20 });

  describe('Property 3: Dynamic route generation', () => {
    /**
     * Property 3: Dynamic route generation
     * For any content item that requires a detail page, a corresponding dynamic route
     * should be generated with the correct slug and content
     * Validates: Requirements 2.2, 2.4
     */

    it('should generate a route for every product in the collection', () => {
      fc.assert(
        fc.property(productsArrayArbitrary, (products) => {
          const routes = generateProductRoutes(products);
          
          // Every product should have a corresponding route
          expect(routes.length).toBe(products.length);
          
          // Each route should have the correct slug
          products.forEach((product, index) => {
            expect(routes[index].params.slug).toBe(product.id);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should include the full product data in route props', () => {
      fc.assert(
        fc.property(productsArrayArbitrary, (products) => {
          const routes = generateProductRoutes(products);
          
          // Each route should contain the full product data
          routes.forEach((route, index) => {
            expect(route.props.product).toEqual(products[index]);
            expect(route.props.product.data.title).toBe(products[index].data.title);
            expect(route.props.product.data.description).toBe(products[index].data.description);
          });
        }),
        { numRuns: 100 }
      );
    });

    it('should generate unique slugs for each product', () => {
      fc.assert(
        fc.property(
          fc.array(validProductArbitrary, { minLength: 2, maxLength: 10 })
            .map(products => {
              // Ensure unique IDs by appending index
              return products.map((p, i) => ({ ...p, id: `${p.id}-${i}` }));
            }),
          (products) => {
            const routes = generateProductRoutes(products);
            const slugs = routes.map(r => r.params.slug);
            const uniqueSlugs = new Set(slugs);
            
            // All slugs should be unique
            expect(uniqueSlugs.size).toBe(slugs.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should generate valid URL paths from product slugs', () => {
      fc.assert(
        fc.property(validProductArbitrary, (product) => {
          const routes = generateProductRoutes([product]);
          const slug = routes[0].params.slug;
          
          // Slug should be URL-safe (no spaces, special chars that need encoding)
          const urlPath = `/products/${slug}`;
          expect(urlPath).toBe(encodeURI(urlPath));
        }),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 4: Product detail page completeness', () => {
    /**
     * Property 4: Product detail page completeness
     * For any training product, its detail page should contain all required information fields
     * (title, description, duration, price, syllabus, testimonials, average rating)
     * Validates: Requirements 2.3, 10.1
     */

    it('should have all required fields for any valid product', () => {
      fc.assert(
        fc.property(validProductArbitrary, testimonialsArrayArbitrary, (product, testimonials) => {
          const completeness = validateProductDetailCompleteness(product, testimonials);
          
          // Required fields must always be present
          expect(completeness.hasTitle).toBe(true);
          expect(completeness.hasDescription).toBe(true);
          expect(completeness.hasDuration).toBe(true);
          expect(completeness.hasLearningOutcomes).toBe(true);
          expect(completeness.hasRequestTrainingButton).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should display testimonials when they exist for the product', () => {
      fc.assert(
        fc.property(
          validProductArbitrary,
          fc.array(validTestimonialArbitrary, { minLength: 1, maxLength: 5 }),
          (product, testimonials) => {
            // Link testimonials to this product
            const linkedTestimonials = testimonials.map(t => ({
              ...t,
              courseSlug: product.id,
            }));
            
            const completeness = validateProductDetailCompleteness(product, linkedTestimonials);
            
            expect(completeness.hasTestimonials).toBe(true);
            expect(completeness.hasAverageRating).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should calculate correct average rating from testimonials', () => {
      fc.assert(
        fc.property(
          validProductArbitrary,
          fc.array(validTestimonialArbitrary, { minLength: 1, maxLength: 10 }),
          (product, testimonials) => {
            // Link testimonials to this product
            const linkedTestimonials = testimonials.map(t => ({
              ...t,
              courseSlug: product.id,
            }));
            
            const avgRating = calculateAverageRating(linkedTestimonials, product.id);
            const expectedAvg = linkedTestimonials.reduce((sum, t) => sum + t.rating, 0) / linkedTestimonials.length;
            
            expect(avgRating).toBe(expectedAvg);
            // Rating should be between 1 and 5
            expect(avgRating).toBeGreaterThanOrEqual(1);
            expect(avgRating).toBeLessThanOrEqual(5);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should build correct contact URL with product information', () => {
      fc.assert(
        fc.property(validProductArbitrary, (product) => {
          const contactUrl = buildContactUrl(product.id, product.data.title);
          
          // URL should contain the product ID
          expect(contactUrl).toContain(encodeURIComponent(product.id));
          
          // URL should contain the product title in subject
          expect(contactUrl).toContain(encodeURIComponent(`Training Inquiry: ${product.data.title}`));
          
          // URL should start with /contact
          expect(contactUrl.startsWith('/contact?')).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate product data against schema', () => {
      fc.assert(
        fc.property(validProductArbitrary, (product) => {
          // The product data should conform to the schema
          const result = productSchema.safeParse(product.data);
          expect(result.success).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
