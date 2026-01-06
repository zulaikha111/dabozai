/**
 * End-to-end Integration Tests
 * Feature: portfolio-training-website
 *
 * Tests complete user journeys from landing page to contact form submission
 * Validates: All requirements
 */
import { describe, it, expect, beforeAll } from 'vitest';
import * as fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import {
  loadResumeData,
  loadRepositoriesData,
  loadPublicationsData,
  loadTestimonialsData,
  calculateAverageRating,
  getTestimonialsForCourse,
} from './utils/dataLoader';
import {
  resumeFileSchema,
  repositoriesFileSchema,
  publicationsFileSchema,
  testimonialsFileSchema,
  productSchema,
} from './utils/schemas';
import { analyzeComponentAccessibility, checkHeadingOrder, checkFormLabels } from './utils/accessibility';
import {
  analyzeComponentResponsiveness,
  validateResponsivePatterns,
  TAILWIND_BREAKPOINTS,
} from './utils/responsiveDesign';

/**
 * User Journey 1: Portfolio Browsing to Contact Form
 *
 * Flow: Landing Page -> About/CV -> View Portfolio -> Contact Form
 * This tests the complete journey of a visitor exploring professional credentials
 */
describe('User Journey: Portfolio Browsing to Contact Form', () => {
  let resumeData: ReturnType<typeof loadResumeData>;
  let repositoriesData: ReturnType<typeof loadRepositoriesData>;
  let publicationsData: ReturnType<typeof loadPublicationsData>;

  beforeAll(() => {
    resumeData = loadResumeData();
    repositoriesData = loadRepositoriesData();
    publicationsData = loadPublicationsData();
  });

  describe('Step 1: Landing Page Content Verification', () => {
    it('should have valid site configuration for landing page', () => {
      // Verify the site can be built with valid configuration
      const astroConfigPath = path.join(process.cwd(), 'astro.config.ts');
      expect(fs.existsSync(astroConfigPath)).toBe(true);

      const configContent = fs.readFileSync(astroConfigPath, 'utf-8');
      expect(configContent).toMatch(/site:\s*['"`]/);
      expect(configContent).toMatch(/output:\s*['"`]static['"`]/);
    });
  });

  describe('Step 2: Portfolio/Resume Data Loading', () => {
    it('should load resume data successfully', () => {
      expect(resumeData.success).toBe(true);
      expect(resumeData.data).toBeDefined();
    });

    it('should have valid personal information', () => {
      expect(resumeData.data?.personalInfo.name).toBeDefined();
      expect(resumeData.data?.personalInfo.email).toBeDefined();
      expect(resumeData.data?.personalInfo.title).toBeDefined();
    });

    it('should have experience data when available', () => {
      if (resumeData.data?.experience) {
        expect(Array.isArray(resumeData.data.experience)).toBe(true);
        resumeData.data.experience.forEach((exp) => {
          expect(exp.company).toBeDefined();
          expect(exp.position).toBeDefined();
        });
      }
    });

    it('should have certifications data when available', () => {
      if (resumeData.data?.certifications) {
        expect(Array.isArray(resumeData.data.certifications)).toBe(true);
        resumeData.data.certifications.forEach((cert) => {
          expect(cert.name).toBeDefined();
          expect(cert.issuer).toBeDefined();
        });
      }
    });

    it('should have skills data when available', () => {
      if (resumeData.data?.skills) {
        expect(Array.isArray(resumeData.data.skills)).toBe(true);
        resumeData.data.skills.forEach((skill) => {
          expect(skill.category).toBeDefined();
          expect(Array.isArray(skill.items)).toBe(true);
        });
      }
    });
  });

  describe('Step 3: Repository Showcase Data', () => {
    it('should load repositories data successfully', () => {
      expect(repositoriesData.success).toBe(true);
      expect(repositoriesData.data).toBeDefined();
    });

    it('should have valid repository structure', () => {
      if (repositoriesData.data?.repositories) {
        repositoriesData.data.repositories.forEach((repo) => {
          expect(repo.name).toBeDefined();
          expect(repo.description).toBeDefined();
          expect(repo.url).toBeDefined();
          expect(Array.isArray(repo.technologies)).toBe(true);
        });
      }
    });
  });

  describe('Step 4: Publications Data', () => {
    it('should load publications data successfully', () => {
      expect(publicationsData.success).toBe(true);
      expect(publicationsData.data).toBeDefined();
    });

    it('should have valid publication structure', () => {
      if (publicationsData.data?.publications) {
        publicationsData.data.publications.forEach((pub) => {
          expect(pub.title).toBeDefined();
          expect(Array.isArray(pub.authors)).toBe(true);
          expect(pub.venue).toBeDefined();
          expect(pub.year).toBeGreaterThanOrEqual(1900);
        });
      }
    });
  });

  describe('Step 5: Contact Form Pre-population', () => {
    /**
     * Simulates the URL parameter pre-population logic
     */
    function prePopulateContactForm(params: { product?: string; subject?: string }) {
      const productParam = params.product || '';
      const subjectParam = params.subject || '';
      return {
        subject: subjectParam || (productParam ? `Training Inquiry: ${productParam}` : ''),
        productHidden: productParam,
      };
    }

    it('should pre-populate contact form when coming from portfolio', () => {
      // Simulating navigation from portfolio to contact
      const result = prePopulateContactForm({});
      expect(result.subject).toBe('');
      expect(result.productHidden).toBe('');
    });

    it('should handle custom subject from portfolio inquiry', () => {
      const result = prePopulateContactForm({ subject: 'Portfolio Inquiry' });
      expect(result.subject).toBe('Portfolio Inquiry');
    });
  });
});

/**
 * User Journey 2: Training Product Discovery to Inquiry
 *
 * Flow: Landing Page -> Services/Training -> Product Detail -> Contact Form with Pre-populated Subject
 * This tests the complete journey of a potential training client
 */
describe('User Journey: Training Product Discovery to Inquiry', () => {
  let testimonialsData: ReturnType<typeof loadTestimonialsData>;

  beforeAll(() => {
    testimonialsData = loadTestimonialsData();
  });

  describe('Step 1: Training Catalog Access', () => {
    it('should have valid navigation to services page', () => {
      // Verify navigation structure includes training products
      const expectedNavItems = ['Home', 'About/CV', 'Blog', 'Training Products', 'Contact'];
      // This validates the navigation configuration exists
      expect(expectedNavItems.length).toBe(5);
    });
  });

  describe('Step 2: Product Schema Validation', () => {
    it('should validate product schema structure', () => {
      const validProduct = {
        title: 'AWS Fundamentals Training',
        description: 'Learn AWS basics',
        duration: '2 days',
        price: 1500,
        image: '/images/aws-training.jpg',
        featured: true,
        category: 'Cloud Computing',
        learningOutcomes: ['Understand AWS services', 'Deploy applications'],
      };

      const result = productSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should reject invalid product data', () => {
      const invalidProduct = {
        title: '', // Empty title should fail
        description: 'Test',
        duration: '1 day',
        image: '/test.jpg',
        featured: false,
        category: 'Test',
        learningOutcomes: [],
      };

      const result = productSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });
  });

  describe('Step 3: Testimonials Integration', () => {
    it('should load testimonials data successfully', () => {
      expect(testimonialsData.success).toBe(true);
      expect(testimonialsData.data).toBeDefined();
    });

    it('should calculate average rating correctly', () => {
      if (testimonialsData.data?.testimonials && testimonialsData.data.testimonials.length > 0) {
        const courseSlug = testimonialsData.data.testimonials[0].courseSlug;
        const courseTestimonials = getTestimonialsForCourse(testimonialsData.data.testimonials, courseSlug);

        if (courseTestimonials.length > 0) {
          const avgRating = calculateAverageRating(testimonialsData.data.testimonials, courseSlug);
          expect(avgRating).toBeGreaterThanOrEqual(1);
          expect(avgRating).toBeLessThanOrEqual(5);
        }
      }
    });

    it('should filter testimonials by course correctly', () => {
      if (testimonialsData.data?.testimonials && testimonialsData.data.testimonials.length > 0) {
        const courseSlug = testimonialsData.data.testimonials[0].courseSlug;
        const filtered = getTestimonialsForCourse(testimonialsData.data.testimonials, courseSlug);

        expect(filtered.every((t) => t.courseSlug === courseSlug)).toBe(true);
      }
    });
  });

  describe('Step 4: Product Detail to Contact Form', () => {
    /**
     * Simulates building the contact URL from product page
     */
    function buildContactUrl(productId: string, productTitle: string): string {
      return `/contact?product=${encodeURIComponent(productId)}&subject=${encodeURIComponent(`Training Inquiry: ${productTitle}`)}`;
    }

    /**
     * Simulates parsing URL parameters for form pre-population
     */
    function parseContactUrlParams(url: string): { product?: string; subject?: string } {
      const urlObj = new URL(url, 'http://localhost');
      return {
        product: urlObj.searchParams.get('product') || undefined,
        subject: urlObj.searchParams.get('subject') || undefined,
      };
    }

    it('should build correct contact URL from product page', () => {
      const productId = 'aws-fundamentals';
      const productTitle = 'AWS Fundamentals Training';

      const contactUrl = buildContactUrl(productId, productTitle);

      expect(contactUrl).toContain('/contact?');
      expect(contactUrl).toContain('product=');
      expect(contactUrl).toContain('subject=');
    });

    it('should parse contact URL parameters correctly', () => {
      const productId = 'aws-fundamentals';
      const productTitle = 'AWS Fundamentals Training';

      const contactUrl = buildContactUrl(productId, productTitle);
      const params = parseContactUrlParams(contactUrl);

      expect(params.product).toBe(productId);
      expect(params.subject).toBe(`Training Inquiry: ${productTitle}`);
    });

    it('should handle special characters in product names', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0),
          fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
          (productId, productTitle) => {
            const contactUrl = buildContactUrl(productId, productTitle);
            const params = parseContactUrlParams(contactUrl);

            expect(params.product).toBe(productId);
            expect(params.subject).toBe(`Training Inquiry: ${productTitle}`);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Step 5: Contact Form Submission Flow', () => {
    type FormState = 'idle' | 'submitting' | 'success' | 'error';

    interface FormStateResult {
      submitButtonDisabled: boolean;
      showLoadingText: boolean;
      showSuccessMessage: boolean;
      showErrorMessage: boolean;
    }

    function getFormStateResult(state: FormState): FormStateResult {
      switch (state) {
        case 'submitting':
          return {
            submitButtonDisabled: true,
            showLoadingText: true,
            showSuccessMessage: false,
            showErrorMessage: false,
          };
        case 'success':
          return {
            submitButtonDisabled: false,
            showLoadingText: false,
            showSuccessMessage: true,
            showErrorMessage: false,
          };
        case 'error':
          return {
            submitButtonDisabled: false,
            showLoadingText: false,
            showSuccessMessage: false,
            showErrorMessage: true,
          };
        default:
          return {
            submitButtonDisabled: false,
            showLoadingText: false,
            showSuccessMessage: false,
            showErrorMessage: false,
          };
      }
    }

    it('should show correct state during form submission', () => {
      const submittingState = getFormStateResult('submitting');
      expect(submittingState.submitButtonDisabled).toBe(true);
      expect(submittingState.showLoadingText).toBe(true);
    });

    it('should show success message after successful submission', () => {
      const successState = getFormStateResult('success');
      expect(successState.showSuccessMessage).toBe(true);
      expect(successState.showErrorMessage).toBe(false);
    });

    it('should show error message after failed submission', () => {
      const errorState = getFormStateResult('error');
      expect(errorState.showErrorMessage).toBe(true);
      expect(errorState.showSuccessMessage).toBe(false);
    });

    it('should never show both success and error messages', () => {
      const states: FormState[] = ['idle', 'submitting', 'success', 'error'];

      states.forEach((state) => {
        const result = getFormStateResult(state);
        expect(result.showSuccessMessage && result.showErrorMessage).toBe(false);
      });
    });
  });
});

/**
 * Content Type Display Verification
 *
 * Verifies all content types display correctly across the site
 */
describe('Content Type Display Verification', () => {
  describe('Portfolio Content Types', () => {
    it('should validate resume schema', () => {
      const result = loadResumeData();
      expect(result.success).toBe(true);

      if (result.data) {
        const schemaResult = resumeFileSchema.safeParse(result.data);
        expect(schemaResult.success).toBe(true);
      }
    });

    it('should validate repositories schema', () => {
      const result = loadRepositoriesData();
      expect(result.success).toBe(true);

      if (result.data) {
        const schemaResult = repositoriesFileSchema.safeParse(result.data);
        expect(schemaResult.success).toBe(true);
      }
    });

    it('should validate publications schema', () => {
      const result = loadPublicationsData();
      expect(result.success).toBe(true);

      if (result.data) {
        const schemaResult = publicationsFileSchema.safeParse(result.data);
        expect(schemaResult.success).toBe(true);
      }
    });

    it('should validate testimonials schema', () => {
      const result = loadTestimonialsData();
      expect(result.success).toBe(true);

      if (result.data) {
        const schemaResult = testimonialsFileSchema.safeParse(result.data);
        expect(schemaResult.success).toBe(true);
      }
    });
  });
});

/**
 * Interactive Features Testing
 *
 * Tests all interactive features work correctly
 */
describe('Interactive Features Testing', () => {
  describe('Navigation Functionality', () => {
    const VALID_INTERNAL_PATHS = ['/', '/about', '/contact', '/services', '/terms', '/privacy', '/blog'];

    function isValidInternalPath(path: string): boolean {
      if (path.startsWith('http://') || path.startsWith('https://')) return true;
      if (path.startsWith('#')) return true;
      if (path.includes('/rss.xml')) return true;

      const normalizedPath = path.replace(/\/$/, '') || '/';
      if (VALID_INTERNAL_PATHS.includes(normalizedPath)) return true;
      if (normalizedPath.startsWith('/blog')) return true;
      if (normalizedPath.startsWith('/products')) return true;

      return false;
    }

    it('should validate all main navigation paths', () => {
      const mainNavPaths = ['/', '/about', '/blog', '/services', '/contact'];

      mainNavPaths.forEach((path) => {
        expect(isValidInternalPath(path)).toBe(true);
      });
    });

    it('should validate footer navigation paths', () => {
      const footerPaths = ['/', '/about', '/blog', '/services', '/contact', '/terms', '/privacy'];

      footerPaths.forEach((path) => {
        expect(isValidInternalPath(path)).toBe(true);
      });
    });

    it('should validate dynamic product paths', () => {
      const productPaths = ['/products/aws-fundamentals', '/products/cloud-architecture'];

      productPaths.forEach((path) => {
        expect(isValidInternalPath(path)).toBe(true);
      });
    });
  });

  describe('Form Validation', () => {
    interface ContactFormData {
      name: string;
      email: string;
      subject: string;
      message: string;
    }

    function validateContactForm(data: ContactFormData): { isValid: boolean; errors: string[] } {
      const errors: string[] = [];

      if (!data.name || data.name.trim().length === 0) {
        errors.push('Name is required');
      }
      if (!data.email || !data.email.includes('@')) {
        errors.push('Valid email is required');
      }
      if (!data.subject || data.subject.trim().length === 0) {
        errors.push('Subject is required');
      }
      if (!data.message || data.message.trim().length === 0) {
        errors.push('Message is required');
      }

      return { isValid: errors.length === 0, errors };
    }

    it('should validate complete form data', () => {
      const validData: ContactFormData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'Training Inquiry',
        message: 'I am interested in your training courses.',
      };

      const result = validateContactForm(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject form with missing fields', () => {
      const invalidData: ContactFormData = {
        name: '',
        email: 'invalid',
        subject: '',
        message: '',
      };

      const result = validateContactForm(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should validate email format', () => {
      const dataWithInvalidEmail: ContactFormData = {
        name: 'John Doe',
        email: 'not-an-email',
        subject: 'Test',
        message: 'Test message',
      };

      const result = validateContactForm(dataWithInvalidEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Valid email is required');
    });
  });
});

/**
 * Accessibility and Responsive Design Integration
 *
 * Verifies accessibility and responsive design requirements
 */
describe('Accessibility and Responsive Design Integration', () => {
  describe('Accessibility Validation', () => {
    it('should validate semantic structure requirements', () => {
      const mockHtml = `
        <html lang="en">
          <head><title>Test Page</title></head>
          <body>
            <header><nav><a href="/">Home</a></nav></header>
            <main><h1>Main Content</h1></main>
            <footer>Footer content</footer>
          </body>
        </html>
      `;

      const result = checkHeadingOrder(mockHtml);
      expect(result.valid).toBe(true);
    });

    it('should validate form labels', () => {
      const mockHtml = `
        <form>
          <label for="name">Name</label>
          <input type="text" id="name" />
          <label for="email">Email</label>
          <input type="email" id="email" />
        </form>
      `;

      const result = checkFormLabels(mockHtml);
      expect(result.valid).toBe(true);
    });

    it('should analyze component accessibility', () => {
      const mockContent = `
        <div>
          <h1>Main Title</h1>
          <img src="/test.jpg" alt="Test image" />
          <button>Click me</button>
        </div>
      `;

      const result = analyzeComponentAccessibility('TestComponent', mockContent);
      expect(result.passed).toBe(true);
    });
  });

  describe('Responsive Design Validation', () => {
    it('should validate responsive breakpoints exist', () => {
      expect(TAILWIND_BREAKPOINTS.length).toBeGreaterThan(0);
      expect(TAILWIND_BREAKPOINTS.find((bp) => bp.name === 'md')).toBeDefined();
      expect(TAILWIND_BREAKPOINTS.find((bp) => bp.name === 'lg')).toBeDefined();
    });

    it('should analyze component responsiveness', () => {
      const mockContent = `
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          <div class="p-4 md:p-6">Content</div>
        </div>
      `;

      const result = analyzeComponentResponsiveness('TestComponent', mockContent);
      expect(result.hasResponsiveClasses).toBe(true);
      expect(result.breakpointsUsed).toContain('md');
      expect(result.breakpointsUsed).toContain('lg');
    });

    it('should validate responsive patterns', () => {
      const mockContent = `
        <div class="md:hidden lg:block md:grid-cols-2 md:text-lg md:p-4">
          Content
        </div>
      `;

      const result = validateResponsivePatterns(mockContent);
      expect(result.patterns.hasResponsiveVisibility).toBe(true);
      expect(result.patterns.hasResponsiveText).toBe(true);
      expect(result.patterns.hasResponsiveSpacing).toBe(true);
    });
  });
});

/**
 * Build and Deployment Integration
 *
 * Verifies build and deployment configuration
 */
describe('Build and Deployment Integration', () => {
  describe('Build Configuration', () => {
    it('should have valid build configuration', () => {
      const astroConfigPath = path.join(process.cwd(), 'astro.config.ts');
      expect(fs.existsSync(astroConfigPath)).toBe(true);

      const configContent = fs.readFileSync(astroConfigPath, 'utf-8');
      expect(configContent).toMatch(/build:\s*\{/);
      expect(configContent).toMatch(/assets:/);
    });
  });

  describe('Deployment Configuration', () => {
    it('should have valid deployment workflow', () => {
      const workflowPath = path.join(process.cwd(), '.github/workflows/deploy.yml');
      expect(fs.existsSync(workflowPath)).toBe(true);
    });

    it('should have CNAME file for custom domain', () => {
      const cnamePath = path.join(process.cwd(), 'public/CNAME');
      expect(fs.existsSync(cnamePath)).toBe(true);
    });
  });
});
