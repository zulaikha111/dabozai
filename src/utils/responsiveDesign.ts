/**
 * Responsive Design Verification Utilities
 * Validates: Requirement 5.2 - Responsive design on mobile and desktop
 */

export interface Breakpoint {
  name: string;
  minWidth: number;
  maxWidth?: number;
}

export interface ResponsiveClass {
  className: string;
  breakpoint: string;
  property: string;
}

export interface ComponentResponsiveAnalysis {
  componentName: string;
  hasResponsiveClasses: boolean;
  breakpointsUsed: string[];
  responsiveClasses: ResponsiveClass[];
  issues: string[];
}

/**
 * Tailwind CSS default breakpoints
 */
export const TAILWIND_BREAKPOINTS: Breakpoint[] = [
  { name: 'sm', minWidth: 640 },
  { name: 'md', minWidth: 768 },
  { name: 'lg', minWidth: 1024 },
  { name: 'xl', minWidth: 1280 },
  { name: '2xl', minWidth: 1536 },
];

/**
 * Common viewport sizes for testing
 */
export const COMMON_VIEWPORTS = {
  mobile: { width: 375, height: 667, name: 'Mobile (iPhone SE)' },
  mobileLarge: { width: 414, height: 896, name: 'Mobile Large (iPhone 11)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (iPad)' },
  laptop: { width: 1024, height: 768, name: 'Laptop' },
  desktop: { width: 1280, height: 800, name: 'Desktop' },
  desktopLarge: { width: 1920, height: 1080, name: 'Desktop Large (Full HD)' },
};

/**
 * Extracts responsive Tailwind classes from a class string
 */
export function extractResponsiveClasses(classString: string): ResponsiveClass[] {
  const classes = classString.split(/\s+/).filter(Boolean);
  const responsiveClasses: ResponsiveClass[] = [];
  
  const breakpointPrefixes = ['sm:', 'md:', 'lg:', 'xl:', '2xl:'];
  
  for (const cls of classes) {
    for (const prefix of breakpointPrefixes) {
      if (cls.startsWith(prefix)) {
        const breakpoint = prefix.replace(':', '');
        const property = cls.substring(prefix.length);
        responsiveClasses.push({
          className: cls,
          breakpoint,
          property,
        });
        break;
      }
    }
  }
  
  return responsiveClasses;
}

/**
 * Checks if a class string contains responsive classes
 */
export function hasResponsiveClasses(classString: string): boolean {
  return extractResponsiveClasses(classString).length > 0;
}

/**
 * Gets unique breakpoints used in a class string
 */
export function getBreakpointsUsed(classString: string): string[] {
  const responsiveClasses = extractResponsiveClasses(classString);
  const breakpoints = new Set(responsiveClasses.map(rc => rc.breakpoint));
  return Array.from(breakpoints);
}

/**
 * Analyzes component content for responsive design patterns
 */
export function analyzeComponentResponsiveness(
  componentName: string,
  content: string
): ComponentResponsiveAnalysis {
  const issues: string[] = [];
  const allClasses: string[] = [];
  
  // Extract class attributes from the content
  const classMatches = content.matchAll(/class(?:List)?=(?:"([^"]+)"|{([^}]+)}|\[([^\]]+)\])/g);
  
  for (const match of classMatches) {
    const classValue = match[1] || match[2] || match[3] || '';
    allClasses.push(classValue);
  }
  
  const combinedClasses = allClasses.join(' ');
  const responsiveClasses = extractResponsiveClasses(combinedClasses);
  const breakpointsUsed = getBreakpointsUsed(combinedClasses);
  
  // Check for common responsive design issues
  
  // Issue: Fixed widths without responsive alternatives
  if (content.includes('w-[') && !content.includes('md:w-') && !content.includes('lg:w-')) {
    issues.push('Fixed width values detected without responsive alternatives');
  }
  
  // Issue: No mobile-first responsive classes
  if (breakpointsUsed.length > 0 && !breakpointsUsed.includes('md') && !breakpointsUsed.includes('sm')) {
    issues.push('Responsive classes found but no mobile breakpoints (sm/md) used');
  }
  
  // Issue: Grid without responsive columns
  if (content.includes('grid-cols-') && !content.includes('md:grid-cols-') && !content.includes('lg:grid-cols-')) {
    // Check if it's a single column grid (which is fine)
    if (!content.includes('grid-cols-1')) {
      issues.push('Grid layout without responsive column adjustments');
    }
  }
  
  // Issue: Flex direction without responsive changes for complex layouts
  if (content.includes('flex-row') && !content.includes('flex-col') && !content.includes('md:flex-')) {
    // This might be intentional, so it's a soft warning
  }
  
  // Issue: Hidden elements without responsive visibility
  if (content.includes('hidden') && !content.includes('md:block') && !content.includes('md:flex') && !content.includes('md:hidden')) {
    // Check if it's a honeypot or intentionally hidden element
    if (!content.includes('aria-hidden') && !content.includes('botcheck')) {
      issues.push('Hidden elements without responsive visibility toggles');
    }
  }
  
  return {
    componentName,
    hasResponsiveClasses: responsiveClasses.length > 0,
    breakpointsUsed,
    responsiveClasses,
    issues,
  };
}

/**
 * Validates that essential responsive patterns are present
 */
export function validateResponsivePatterns(content: string): {
  valid: boolean;
  patterns: {
    hasMobileMenu: boolean;
    hasResponsiveGrid: boolean;
    hasResponsiveText: boolean;
    hasResponsiveSpacing: boolean;
    hasResponsiveVisibility: boolean;
  };
  missingPatterns: string[];
} {
  const patterns = {
    hasMobileMenu: content.includes('md:hidden') || content.includes('md:flex') || content.includes('ToggleMenu'),
    hasResponsiveGrid: content.includes('md:grid-cols-') || content.includes('lg:grid-cols-'),
    hasResponsiveText: content.includes('md:text-') || content.includes('lg:text-'),
    hasResponsiveSpacing: content.includes('md:p-') || content.includes('md:px-') || content.includes('md:py-') || 
                          content.includes('lg:p-') || content.includes('md:gap-'),
    hasResponsiveVisibility: content.includes('md:block') || content.includes('md:hidden') || 
                             content.includes('lg:block') || content.includes('lg:hidden'),
  };
  
  const missingPatterns: string[] = [];
  
  // These are soft checks - not all components need all patterns
  if (!patterns.hasResponsiveGrid && content.includes('grid')) {
    missingPatterns.push('Responsive grid columns');
  }
  
  return {
    valid: missingPatterns.length === 0,
    patterns,
    missingPatterns,
  };
}

/**
 * Gets the active breakpoint for a given viewport width
 */
export function getActiveBreakpoint(viewportWidth: number): string {
  let activeBreakpoint = 'base';
  
  for (const bp of TAILWIND_BREAKPOINTS) {
    if (viewportWidth >= bp.minWidth) {
      activeBreakpoint = bp.name;
    }
  }
  
  return activeBreakpoint;
}

/**
 * Checks if a viewport width matches a specific breakpoint
 */
export function isBreakpointActive(viewportWidth: number, breakpoint: string): boolean {
  const bp = TAILWIND_BREAKPOINTS.find(b => b.name === breakpoint);
  if (!bp) return false;
  return viewportWidth >= bp.minWidth;
}

/**
 * Generates a responsive design report for multiple components
 */
export function generateResponsiveReport(
  components: Array<{ name: string; content: string }>
): {
  summary: {
    totalComponents: number;
    responsiveComponents: number;
    componentsWithIssues: number;
  };
  components: ComponentResponsiveAnalysis[];
  overallIssues: string[];
} {
  const analyses = components.map(c => analyzeComponentResponsiveness(c.name, c.content));
  
  const responsiveComponents = analyses.filter(a => a.hasResponsiveClasses).length;
  const componentsWithIssues = analyses.filter(a => a.issues.length > 0).length;
  
  const overallIssues: string[] = [];
  
  // Check for overall responsive design coverage
  const allBreakpoints = new Set<string>();
  for (const analysis of analyses) {
    for (const bp of analysis.breakpointsUsed) {
      allBreakpoints.add(bp);
    }
  }
  
  if (!allBreakpoints.has('md')) {
    overallIssues.push('No components use the md (tablet) breakpoint');
  }
  
  if (!allBreakpoints.has('lg')) {
    overallIssues.push('No components use the lg (laptop) breakpoint');
  }
  
  return {
    summary: {
      totalComponents: components.length,
      responsiveComponents,
      componentsWithIssues,
    },
    components: analyses,
    overallIssues,
  };
}
