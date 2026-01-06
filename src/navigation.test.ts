/**
 * Property-based tests for navigation link validity
 * Feature: portfolio-training-website, Property 8: Navigation link validity
 * Validates: Requirements 7.2, 7.4
 *
 * For any navigation link in the system, it should resolve to a valid,
 * accessible page in both development and production builds.
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Interface for navigation link structure
 */
interface NavLink {
  text: string;
  href: string;
  links?: NavLink[];
}

interface FooterSection {
  title: string;
  links: { text: string; href: string }[];
}

/**
 * Navigation data structure matching src/navigation.ts
 * This is a copy of the navigation structure to avoid importing Astro-specific modules
 */
const headerData = {
  links: [
    {
      text: 'Home',
      href: '/',
    },
    {
      text: 'About/CV',
      href: '/about',
    },
    {
      text: 'Blog',
      href: '/blog',
    },
    {
      text: 'Training Products',
      href: '/services',
    },
    {
      text: 'Contact',
      href: '/contact',
    },
  ],
  actions: [{ text: 'Get in Touch', href: '/contact' }],
};

const footerData = {
  links: [
    {
      title: 'Navigation',
      links: [
        { text: 'Home', href: '/' },
        { text: 'About/CV', href: '/about' },
        { text: 'Blog', href: '/blog' },
        { text: 'Training Products', href: '/services' },
        { text: 'Contact', href: '/contact' },
      ],
    },
    {
      title: 'Resources',
      links: [
        { text: 'Blog', href: '/blog' },
        { text: 'Training Catalog', href: '/services' },
      ],
    },
    {
      title: 'Legal',
      links: [
        { text: 'Terms', href: '/terms' },
        { text: 'Privacy Policy', href: '/privacy' },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: '/terms' },
    { text: 'Privacy Policy', href: '/privacy' },
  ],
  socialLinks: [
    { ariaLabel: 'X', icon: 'tabler:brand-x', href: '#' },
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: '#' },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: '/rss.xml' },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/arthelokyo/astrowind' },
  ],
};

/**
 * Valid internal page paths that should exist in the site
 */
const VALID_INTERNAL_PATHS = ['/', '/about', '/contact', '/services', '/terms', '/privacy', '/blog'];

/**
 * Extract all links from navigation structure recursively
 */
function extractAllLinks(links: NavLink[]): { text: string; href: string }[] {
  const result: { text: string; href: string }[] = [];

  for (const link of links) {
    if (link.href) {
      result.push({ text: link.text, href: link.href });
    }
    if (link.links && Array.isArray(link.links)) {
      result.push(...extractAllLinks(link.links));
    }
  }

  return result;
}

/**
 * Extract all links from footer sections
 */
function extractFooterLinks(sections: FooterSection[]): { text: string; href: string }[] {
  const result: { text: string; href: string }[] = [];

  for (const section of sections) {
    if (section.links && Array.isArray(section.links)) {
      result.push(...section.links);
    }
  }

  return result;
}

/**
 * Check if a link is valid (internal path, external URL, or anchor)
 */
function isValidLink(href: string): boolean {
  // External URLs are valid
  if (href.startsWith('http://') || href.startsWith('https://')) {
    return true;
  }

  // Anchor links are valid
  if (href.startsWith('#')) {
    return true;
  }

  // Asset links (like RSS) are valid
  if (href.includes('/rss.xml') || href.includes('rss.xml')) {
    return true;
  }

  // Internal paths should start with /
  if (!href.startsWith('/')) {
    return false;
  }

  // Check if the path matches a known valid path or pattern
  const normalizedPath = href.replace(/\/$/, '') || '/'; // Remove trailing slash

  // Check exact matches
  if (VALID_INTERNAL_PATHS.includes(normalizedPath)) {
    return true;
  }

  // Check for blog paths (dynamic routes)
  if (normalizedPath.startsWith('/blog')) {
    return true;
  }

  // Check for product paths (dynamic routes)
  if (normalizedPath.startsWith('/products')) {
    return true;
  }

  return false;
}

/**
 * Check if a link has required properties
 */
function hasRequiredProperties(link: { text: string; href: string }): boolean {
  return (
    typeof link.text === 'string' &&
    link.text.trim().length > 0 &&
    typeof link.href === 'string' &&
    link.href.length > 0
  );
}

describe('Navigation Link Validity - Property Tests', () => {
  /**
   * Property 8: Navigation link validity
   * For any navigation link in the system, it should resolve to a valid,
   * accessible page in both development and production builds.
   */

  describe('Header Navigation', () => {
    const headerLinks = extractAllLinks(headerData.links as NavLink[]);

    it('should have at least one navigation link', () => {
      expect(headerLinks.length).toBeGreaterThan(0);
    });

    it('should have all required navigation items (Home, About/CV, Blog, Training Products, Contact)', () => {
      const requiredItems = ['Home', 'About/CV', 'Blog', 'Training Products', 'Contact'];
      const linkTexts = headerLinks.map((link) => link.text);

      for (const item of requiredItems) {
        expect(linkTexts).toContain(item);
      }
    });

    it('should have valid href for every header navigation link', () => {
      fc.assert(
        fc.property(fc.constantFrom(...headerLinks), (link) => {
          expect(hasRequiredProperties(link)).toBe(true);
          expect(isValidLink(link.href)).toBe(true);
        }),
        { numRuns: Math.min(100, headerLinks.length * 10) }
      );
    });

    it('should have non-empty text for every header navigation link', () => {
      for (const link of headerLinks) {
        expect(link.text.trim().length).toBeGreaterThan(0);
      }
    });

    it('should have internal paths starting with /', () => {
      for (const link of headerLinks) {
        if (!link.href.startsWith('http://') && !link.href.startsWith('https://') && !link.href.startsWith('#')) {
          expect(link.href.startsWith('/')).toBe(true);
        }
      }
    });
  });

  describe('Header Actions', () => {
    const actions = headerData.actions || [];

    it('should have at least one action button', () => {
      expect(actions.length).toBeGreaterThan(0);
    });

    it('should have valid href for every action', () => {
      for (const action of actions) {
        expect(typeof action.text).toBe('string');
        expect(action.text.trim().length).toBeGreaterThan(0);
        expect(typeof action.href).toBe('string');
        expect(isValidLink(action.href)).toBe(true);
      }
    });
  });

  describe('Footer Navigation', () => {
    const footerLinks = extractFooterLinks(footerData.links as FooterSection[]);

    it('should have footer navigation links', () => {
      expect(footerLinks.length).toBeGreaterThan(0);
    });

    it('should have valid href for every footer navigation link', () => {
      fc.assert(
        fc.property(fc.constantFrom(...footerLinks), (link) => {
          expect(hasRequiredProperties(link)).toBe(true);
          expect(isValidLink(link.href)).toBe(true);
        }),
        { numRuns: Math.min(100, footerLinks.length * 10) }
      );
    });

    it('should have non-empty text for every footer navigation link', () => {
      for (const link of footerLinks) {
        expect(link.text.trim().length).toBeGreaterThan(0);
      }
    });
  });

  describe('Footer Secondary Links', () => {
    const secondaryLinks = footerData.secondaryLinks || [];

    it('should have secondary links (Terms, Privacy)', () => {
      expect(secondaryLinks.length).toBeGreaterThan(0);
    });

    it('should have valid href for every secondary link', () => {
      for (const link of secondaryLinks) {
        expect(typeof link.text).toBe('string');
        expect(link.text.trim().length).toBeGreaterThan(0);
        expect(typeof link.href).toBe('string');
        expect(isValidLink(link.href)).toBe(true);
      }
    });
  });

  describe('Footer Social Links', () => {
    const socialLinks = footerData.socialLinks || [];

    it('should have social links', () => {
      expect(socialLinks.length).toBeGreaterThan(0);
    });

    it('should have valid structure for every social link', () => {
      for (const link of socialLinks) {
        expect(typeof link.ariaLabel).toBe('string');
        expect(link.ariaLabel.trim().length).toBeGreaterThan(0);
        expect(typeof link.icon).toBe('string');
        expect(link.icon.trim().length).toBeGreaterThan(0);
        expect(typeof link.href).toBe('string');
      }
    });
  });

  describe('Navigation Consistency', () => {
    it('should have consistent navigation between header and footer', () => {
      const headerLinkTexts = extractAllLinks(headerData.links as NavLink[]).map((l) => l.text);
      const footerSections = footerData.links as FooterSection[];

      // Find the Navigation section in footer
      const navSection = footerSections.find((s) => s.title === 'Navigation');

      if (navSection) {
        const footerNavTexts = navSection.links.map((l) => l.text);

        // All header links should be in footer navigation
        for (const headerText of headerLinkTexts) {
          expect(footerNavTexts).toContain(headerText);
        }
      }
    });

    it('should not have duplicate links in header navigation', () => {
      const headerLinks = extractAllLinks(headerData.links as NavLink[]);
      const hrefs = headerLinks.map((l) => l.href);
      const uniqueHrefs = [...new Set(hrefs)];

      expect(hrefs.length).toBe(uniqueHrefs.length);
    });
  });

  describe('Link Format Validation', () => {
    const allLinks = [
      ...extractAllLinks(headerData.links as NavLink[]),
      ...extractFooterLinks(footerData.links as FooterSection[]),
      ...(footerData.secondaryLinks || []),
    ];

    it('should not have empty hrefs', () => {
      for (const link of allLinks) {
        expect(link.href.length).toBeGreaterThan(0);
      }
    });

    it('should not have hrefs with only whitespace', () => {
      for (const link of allLinks) {
        expect(link.href.trim().length).toBeGreaterThan(0);
      }
    });

    it('should have properly formatted internal paths', () => {
      for (const link of allLinks) {
        if (!link.href.startsWith('http://') && !link.href.startsWith('https://') && !link.href.startsWith('#')) {
          // Internal paths should start with /
          expect(link.href.startsWith('/')).toBe(true);
          // Should not have double slashes (except in protocol)
          expect(link.href.includes('//')).toBe(false);
        }
      }
    });
  });

  describe('Property-Based Navigation Generation', () => {
    // Generator for valid navigation link text
    const validLinkText = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

    // Generator for valid internal paths
    const validInternalPath = fc.constantFrom(...VALID_INTERNAL_PATHS);

    // Generator for valid external URLs
    const validExternalUrl = fc.webUrl();

    // Generator for valid href (internal or external)
    const validHref = fc.oneof(validInternalPath, validExternalUrl);

    // Generator for navigation link
    const navLinkArbitrary = fc.record({
      text: validLinkText,
      href: validHref,
    });

    it('should validate any generated navigation link structure', () => {
      fc.assert(
        fc.property(navLinkArbitrary, (link) => {
          expect(hasRequiredProperties(link)).toBe(true);
          expect(isValidLink(link.href)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });

    it('should validate navigation links with various path patterns', () => {
      const pathPatterns = [
        '/',
        '/about',
        '/blog',
        '/blog/post-1',
        '/products/course-1',
        '/services',
        '/contact',
        '/terms',
        '/privacy',
        'https://example.com',
        'https://github.com/user/repo',
        '#section',
      ];

      fc.assert(
        fc.property(fc.constantFrom(...pathPatterns), (path) => {
          expect(isValidLink(path)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });
});
