/**
 * Responsive Design Verification Tests
 * Validates: Requirement 5.2 - Responsive design on mobile and desktop
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import {
  extractResponsiveClasses,
  hasResponsiveClasses,
  getBreakpointsUsed,
  analyzeComponentResponsiveness,
  validateResponsivePatterns,
  getActiveBreakpoint,
  isBreakpointActive,
  generateResponsiveReport,
  TAILWIND_BREAKPOINTS,
  COMMON_VIEWPORTS,
} from './responsiveDesign';

describe('Responsive Design Utilities', () => {
  describe('extractResponsiveClasses', () => {
    it('should extract responsive classes from a class string', () => {
      const classes = 'flex md:flex-row lg:grid-cols-3 p-4 md:p-6';
      const result = extractResponsiveClasses(classes);

      expect(result).toHaveLength(3);
      expect(result).toContainEqual({ className: 'md:flex-row', breakpoint: 'md', property: 'flex-row' });
      expect(result).toContainEqual({ className: 'lg:grid-cols-3', breakpoint: 'lg', property: 'grid-cols-3' });
      expect(result).toContainEqual({ className: 'md:p-6', breakpoint: 'md', property: 'p-6' });
    });

    it('should return empty array for non-responsive classes', () => {
      const classes = 'flex p-4 text-lg bg-white';
      const result = extractResponsiveClasses(classes);
      expect(result).toHaveLength(0);
    });

    it('should handle all breakpoint prefixes', () => {
      const classes = 'sm:text-sm md:text-base lg:text-lg xl:text-xl 2xl:text-2xl';
      const result = extractResponsiveClasses(classes);

      expect(result).toHaveLength(5);
      expect(result.map((r) => r.breakpoint)).toEqual(['sm', 'md', 'lg', 'xl', '2xl']);
    });
  });

  describe('hasResponsiveClasses', () => {
    it('should return true when responsive classes exist', () => {
      expect(hasResponsiveClasses('flex md:hidden')).toBe(true);
      expect(hasResponsiveClasses('lg:grid-cols-2')).toBe(true);
    });

    it('should return false when no responsive classes exist', () => {
      expect(hasResponsiveClasses('flex p-4 text-lg')).toBe(false);
      expect(hasResponsiveClasses('')).toBe(false);
    });
  });

  describe('getBreakpointsUsed', () => {
    it('should return unique breakpoints used', () => {
      const classes = 'md:flex md:p-4 lg:grid-cols-2 md:text-lg';
      const result = getBreakpointsUsed(classes);

      expect(result).toHaveLength(2);
      expect(result).toContain('md');
      expect(result).toContain('lg');
    });
  });

  describe('getActiveBreakpoint', () => {
    it('should return base for small viewports', () => {
      expect(getActiveBreakpoint(320)).toBe('base');
      expect(getActiveBreakpoint(639)).toBe('base');
    });

    it('should return correct breakpoint for each viewport size', () => {
      expect(getActiveBreakpoint(640)).toBe('sm');
      expect(getActiveBreakpoint(768)).toBe('md');
      expect(getActiveBreakpoint(1024)).toBe('lg');
      expect(getActiveBreakpoint(1280)).toBe('xl');
      expect(getActiveBreakpoint(1536)).toBe('2xl');
    });
  });

  describe('isBreakpointActive', () => {
    it('should correctly determine if breakpoint is active', () => {
      expect(isBreakpointActive(800, 'md')).toBe(true);
      expect(isBreakpointActive(700, 'md')).toBe(false);
      expect(isBreakpointActive(1200, 'lg')).toBe(true);
    });

    it('should return false for invalid breakpoint', () => {
      expect(isBreakpointActive(1000, 'invalid')).toBe(false);
    });
  });

  describe('analyzeComponentResponsiveness', () => {
    it('should analyze component with responsive classes', () => {
      const content = `
        <div class="flex flex-col md:flex-row lg:grid-cols-3">
          <div class="p-4 md:p-6">Content</div>
        </div>
      `;

      const result = analyzeComponentResponsiveness('TestComponent', content);

      expect(result.componentName).toBe('TestComponent');
      expect(result.hasResponsiveClasses).toBe(true);
      expect(result.breakpointsUsed).toContain('md');
      expect(result.breakpointsUsed).toContain('lg');
    });

    it('should detect grid without responsive columns', () => {
      const content = `
        <div class="grid grid-cols-3">
          <div>Item 1</div>
          <div>Item 2</div>
        </div>
      `;

      const result = analyzeComponentResponsiveness('GridComponent', content);

      expect(result.issues).toContain('Grid layout without responsive column adjustments');
    });

    it('should not flag single column grids', () => {
      const content = `
        <div class="grid grid-cols-1">
          <div>Item 1</div>
        </div>
      `;

      const result = analyzeComponentResponsiveness('SingleColGrid', content);

      expect(result.issues).not.toContain('Grid layout without responsive column adjustments');
    });
  });

  describe('validateResponsivePatterns', () => {
    it('should detect responsive patterns', () => {
      const content = `
        <div class="hidden md:block">Desktop only</div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3">Grid</div>
        <p class="text-sm md:text-base">Text</p>
        <div class="p-4 md:p-6">Spacing</div>
      `;

      const result = validateResponsivePatterns(content);

      expect(result.patterns.hasResponsiveVisibility).toBe(true);
      expect(result.patterns.hasResponsiveGrid).toBe(true);
      expect(result.patterns.hasResponsiveText).toBe(true);
      expect(result.patterns.hasResponsiveSpacing).toBe(true);
    });
  });

  describe('generateResponsiveReport', () => {
    it('should generate a comprehensive report', () => {
      const components = [
        { name: 'Header', content: '<nav class="flex md:flex-row"><div class="md:hidden">Menu</div></nav>' },
        { name: 'Footer', content: '<footer class="grid md:grid-cols-3 lg:grid-cols-4"></footer>' },
        { name: 'Card', content: '<div class="p-4">Simple card</div>' },
      ];

      const report = generateResponsiveReport(components);

      expect(report.summary.totalComponents).toBe(3);
      expect(report.summary.responsiveComponents).toBe(2);
      expect(report.components).toHaveLength(3);
    });
  });
});

describe('Real Component Responsive Design Verification', () => {
  const componentsDir = 'src/components/widgets';

  const componentFiles = [
    'Portfolio.astro',
    'TrainingCatalog.astro',
    'ContactForm.astro',
    'Testimonials.astro',
    'RepositoryShowcase.astro',
    'Header.astro',
    'Footer.astro',
  ];

  it('should verify all key components have responsive design', () => {
    const components: Array<{ name: string; content: string }> = [];

    for (const file of componentFiles) {
      const filePath = path.join(componentsDir, file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        components.push({ name: file, content });
      }
    }

    const report = generateResponsiveReport(components);

    // Log the report for visibility
    console.log('\n=== Responsive Design Report ===');
    console.log(`Total Components: ${report.summary.totalComponents}`);
    console.log(`Responsive Components: ${report.summary.responsiveComponents}`);
    console.log(`Components with Issues: ${report.summary.componentsWithIssues}`);

    for (const comp of report.components) {
      console.log(`\n${comp.componentName}:`);
      console.log(`  - Has responsive classes: ${comp.hasResponsiveClasses}`);
      console.log(`  - Breakpoints used: ${comp.breakpointsUsed.join(', ') || 'none'}`);
      if (comp.issues.length > 0) {
        console.log(`  - Issues: ${comp.issues.join(', ')}`);
      }
    }

    if (report.overallIssues.length > 0) {
      console.log(`\nOverall Issues: ${report.overallIssues.join(', ')}`);
    }

    // At least 50% of components should have responsive classes
    const responsiveRatio = report.summary.responsiveComponents / report.summary.totalComponents;
    expect(responsiveRatio).toBeGreaterThanOrEqual(0.5);
  });

  it('should verify Header component has mobile menu support', () => {
    const headerPath = path.join(componentsDir, 'Header.astro');
    if (fs.existsSync(headerPath)) {
      const content = fs.readFileSync(headerPath, 'utf-8');

      // Header should have mobile menu toggle
      expect(content).toMatch(/md:hidden|ToggleMenu/);

      // Header should have responsive navigation
      expect(content).toMatch(/md:flex|md:block/);
    }
  });

  it('should verify TrainingCatalog has responsive grid', () => {
    const catalogPath = path.join(componentsDir, 'TrainingCatalog.astro');
    if (fs.existsSync(catalogPath)) {
      const content = fs.readFileSync(catalogPath, 'utf-8');

      // Should have responsive grid columns
      expect(content).toMatch(/md:grid-cols-|lg:grid-cols-/);
    }
  });

  it('should verify ContactForm has responsive layout', () => {
    const formPath = path.join(componentsDir, 'ContactForm.astro');
    if (fs.existsSync(formPath)) {
      const content = fs.readFileSync(formPath, 'utf-8');

      // Should have responsive padding or max-width
      expect(content).toMatch(/sm:p-|lg:p-|max-w-/);
    }
  });
});

describe('Viewport Breakpoint Coverage', () => {
  it('should have all standard Tailwind breakpoints defined', () => {
    expect(TAILWIND_BREAKPOINTS).toHaveLength(5);
    expect(TAILWIND_BREAKPOINTS.map((b) => b.name)).toEqual(['sm', 'md', 'lg', 'xl', '2xl']);
  });

  it('should have common viewport sizes for testing', () => {
    expect(COMMON_VIEWPORTS.mobile.width).toBeLessThan(TAILWIND_BREAKPOINTS[0].minWidth);
    expect(COMMON_VIEWPORTS.tablet.width).toBeGreaterThanOrEqual(TAILWIND_BREAKPOINTS[1].minWidth);
    expect(COMMON_VIEWPORTS.desktop.width).toBeGreaterThanOrEqual(TAILWIND_BREAKPOINTS[3].minWidth);
  });
});
