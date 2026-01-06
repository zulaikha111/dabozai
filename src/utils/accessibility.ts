/**
 * Accessibility Utilities
 * Validates: Requirement 5.3 - Lighthouse scores >95 for Accessibility and SEO
 */

export interface AccessibilityIssue {
  type: 'error' | 'warning';
  rule: string;
  message: string;
  element?: string;
  suggestion?: string;
}

export interface AccessibilityReport {
  componentName: string;
  issues: AccessibilityIssue[];
  score: number;
  passed: boolean;
}

export interface AccessibilityCheckResult {
  valid: boolean;
  issues: AccessibilityIssue[];
}

/**
 * WCAG 2.1 AA compliance rules for static analysis
 */
export const ACCESSIBILITY_RULES = {
  // Images must have alt text
  IMG_ALT: 'img-alt',
  // Links must have discernible text
  LINK_TEXT: 'link-text',
  // Form inputs must have labels
  FORM_LABEL: 'form-label',
  // Buttons must have accessible names
  BUTTON_NAME: 'button-name',
  // Color contrast (can't fully check statically)
  COLOR_CONTRAST: 'color-contrast',
  // Heading hierarchy
  HEADING_ORDER: 'heading-order',
  // ARIA attributes
  ARIA_VALID: 'aria-valid',
  // Focus management
  FOCUS_VISIBLE: 'focus-visible',
  // Language attribute
  HTML_LANG: 'html-lang',
  // Skip links
  SKIP_LINK: 'skip-link',
};

/**
 * Checks if an image element has proper alt text
 */
export function checkImageAlt(imgTag: string): AccessibilityCheckResult {
  const issues: AccessibilityIssue[] = [];

  // Check for alt attribute
  const hasAlt = /alt=["'][^"']*["']/.test(imgTag) || /alt=\{[^}]*\}/.test(imgTag);

  if (!hasAlt) {
    issues.push({
      type: 'error',
      rule: ACCESSIBILITY_RULES.IMG_ALT,
      message: 'Image is missing alt attribute',
      element: imgTag.substring(0, 100),
      suggestion: 'Add alt="" for decorative images or descriptive alt text for informative images',
    });
  }

  // Check for empty alt on non-decorative images
  const hasEmptyAlt = /alt=["']["']/.test(imgTag);
  const hasAriaHidden = /aria-hidden=["']true["']/.test(imgTag);

  if (hasEmptyAlt && !hasAriaHidden) {
    // Empty alt is valid for decorative images, but we flag it as a warning
    issues.push({
      type: 'warning',
      rule: ACCESSIBILITY_RULES.IMG_ALT,
      message: 'Image has empty alt text - ensure this is intentional for decorative images',
      element: imgTag.substring(0, 100),
    });
  }

  return { valid: issues.filter((i) => i.type === 'error').length === 0, issues };
}

/**
 * Checks if a link has discernible text
 */
export function checkLinkText(linkTag: string): AccessibilityCheckResult {
  const issues: AccessibilityIssue[] = [];

  // Check for aria-label
  const hasAriaLabel = /aria-label=["'][^"']+["']/.test(linkTag);

  // Check for text content (simplified check)
  const hasTextContent =
    /<a[^>]*>[^<]+<\/a>/.test(linkTag) || /<a[^>]*>.*<span[^>]*>[^<]+<\/span>.*<\/a>/s.test(linkTag);

  // Check for sr-only text
  const hasSrOnlyText = /sr-only/.test(linkTag);

  if (!hasAriaLabel && !hasTextContent && !hasSrOnlyText) {
    // Check if it's an icon-only link
    const hasIcon = /Icon|icon|svg/.test(linkTag);
    if (hasIcon) {
      issues.push({
        type: 'error',
        rule: ACCESSIBILITY_RULES.LINK_TEXT,
        message: 'Icon-only link is missing accessible name',
        element: linkTag.substring(0, 100),
        suggestion: 'Add aria-label or sr-only text for screen readers',
      });
    }
  }

  return { valid: issues.filter((i) => i.type === 'error').length === 0, issues };
}

/**
 * Checks if form inputs have associated labels
 */
export function checkFormLabels(content: string): AccessibilityCheckResult {
  const issues: AccessibilityIssue[] = [];

  // Find all input elements
  const inputMatches = content.matchAll(/<input[^>]*>/g);

  for (const match of inputMatches) {
    const inputTag = match[0];

    // Skip hidden inputs
    if (/type=["']hidden["']/.test(inputTag)) continue;

    // Check for id attribute
    const idMatch = inputTag.match(/id=["']([^"']+)["']/);

    if (idMatch) {
      const inputId = idMatch[1];
      // Check if there's a label with matching for attribute
      const hasLabel = new RegExp(`<label[^>]*for=["']${inputId}["']`).test(content);
      const hasAriaLabel = /aria-label=["'][^"']+["']/.test(inputTag);
      const hasAriaLabelledBy = /aria-labelledby=["'][^"']+["']/.test(inputTag);

      if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
        issues.push({
          type: 'error',
          rule: ACCESSIBILITY_RULES.FORM_LABEL,
          message: `Input with id="${inputId}" is missing an associated label`,
          element: inputTag.substring(0, 100),
          suggestion: 'Add a <label for="..."> element or aria-label attribute',
        });
      }
    } else {
      // Input without id - check for aria-label
      const hasAriaLabel = /aria-label=["'][^"']+["']/.test(inputTag);
      if (!hasAriaLabel) {
        issues.push({
          type: 'warning',
          rule: ACCESSIBILITY_RULES.FORM_LABEL,
          message: 'Input is missing id attribute for label association',
          element: inputTag.substring(0, 100),
          suggestion: 'Add id attribute and associated label, or use aria-label',
        });
      }
    }
  }

  return { valid: issues.filter((i) => i.type === 'error').length === 0, issues };
}

/**
 * Checks if buttons have accessible names
 */
export function checkButtonNames(content: string): AccessibilityCheckResult {
  const issues: AccessibilityIssue[] = [];

  // Find button elements
  const buttonMatches = content.matchAll(/<button[^>]*>([^<]*)<\/button>/g);

  for (const match of buttonMatches) {
    const buttonTag = match[0];
    const buttonText = match[1].trim();

    const hasAriaLabel = /aria-label=["'][^"']+["']/.test(buttonTag);
    const hasTextContent = buttonText.length > 0;

    if (!hasAriaLabel && !hasTextContent) {
      issues.push({
        type: 'error',
        rule: ACCESSIBILITY_RULES.BUTTON_NAME,
        message: 'Button is missing accessible name',
        element: buttonTag.substring(0, 100),
        suggestion: 'Add text content or aria-label attribute',
      });
    }
  }

  return { valid: issues.filter((i) => i.type === 'error').length === 0, issues };
}

/**
 * Checks heading hierarchy
 */
export function checkHeadingOrder(content: string): AccessibilityCheckResult {
  const issues: AccessibilityIssue[] = [];

  // Find all headings
  const headingMatches = content.matchAll(/<h([1-6])[^>]*>/g);
  const headingLevels: number[] = [];

  for (const match of headingMatches) {
    headingLevels.push(parseInt(match[1], 10));
  }

  // Check for skipped heading levels
  for (let i = 1; i < headingLevels.length; i++) {
    const current = headingLevels[i];
    const previous = headingLevels[i - 1];

    // Heading level should not skip more than one level when going deeper
    if (current > previous + 1) {
      issues.push({
        type: 'warning',
        rule: ACCESSIBILITY_RULES.HEADING_ORDER,
        message: `Heading level skipped from h${previous} to h${current}`,
        suggestion: 'Maintain proper heading hierarchy without skipping levels',
      });
    }
  }

  return { valid: issues.filter((i) => i.type === 'error').length === 0, issues };
}

/**
 * Checks for valid ARIA attributes
 */
export function checkAriaAttributes(content: string): AccessibilityCheckResult {
  const issues: AccessibilityIssue[] = [];

  // Check for common ARIA mistakes

  // aria-hidden on focusable elements
  const ariaHiddenFocusable = content.match(/aria-hidden=["']true["'][^>]*(tabindex=["'][^-][^"']*["']|<button|<a\s)/g);
  if (ariaHiddenFocusable) {
    issues.push({
      type: 'error',
      rule: ACCESSIBILITY_RULES.ARIA_VALID,
      message: 'aria-hidden="true" used on focusable element',
      suggestion: 'Remove aria-hidden or make element non-focusable',
    });
  }

  // Check for aria-label on elements that don't support it
  const ariaLabelOnDiv = content.match(/<div[^>]*aria-label=["'][^"']+["'][^>]*>(?!.*role=)/g);
  if (ariaLabelOnDiv) {
    issues.push({
      type: 'warning',
      rule: ACCESSIBILITY_RULES.ARIA_VALID,
      message: 'aria-label on div without role attribute may not be announced',
      suggestion: 'Add appropriate role attribute or use a semantic element',
    });
  }

  return { valid: issues.filter((i) => i.type === 'error').length === 0, issues };
}

/**
 * Analyzes a component for accessibility issues
 */
export function analyzeComponentAccessibility(componentName: string, content: string): AccessibilityReport {
  const allIssues: AccessibilityIssue[] = [];

  // Run all checks
  const imgCheck = checkImageAlt(content);
  allIssues.push(...imgCheck.issues);

  const formCheck = checkFormLabels(content);
  allIssues.push(...formCheck.issues);

  const buttonCheck = checkButtonNames(content);
  allIssues.push(...buttonCheck.issues);

  const headingCheck = checkHeadingOrder(content);
  allIssues.push(...headingCheck.issues);

  const ariaCheck = checkAriaAttributes(content);
  allIssues.push(...ariaCheck.issues);

  // Calculate score (simplified)
  const errorCount = allIssues.filter((i) => i.type === 'error').length;
  const warningCount = allIssues.filter((i) => i.type === 'warning').length;

  // Score calculation: start at 100, subtract 10 for each error, 2 for each warning
  const score = Math.max(0, 100 - errorCount * 10 - warningCount * 2);

  return {
    componentName,
    issues: allIssues,
    score,
    passed: errorCount === 0,
  };
}

/**
 * Generates accessibility recommendations for common patterns
 */
export function getAccessibilityRecommendations(): string[] {
  return [
    'Use semantic HTML elements (nav, main, article, section, aside, footer)',
    'Ensure all images have descriptive alt text or alt="" for decorative images',
    'Provide visible focus indicators for all interactive elements',
    'Maintain proper heading hierarchy (h1 -> h2 -> h3)',
    'Use aria-label for icon-only buttons and links',
    'Ensure sufficient color contrast (4.5:1 for normal text, 3:1 for large text)',
    'Make all functionality available via keyboard',
    'Provide skip links for keyboard users',
    'Use aria-live regions for dynamic content updates',
    'Test with screen readers (VoiceOver, NVDA, JAWS)',
  ];
}

/**
 * SEO optimization checks
 */
export interface SEOCheckResult {
  valid: boolean;
  issues: Array<{
    type: 'error' | 'warning';
    rule: string;
    message: string;
    suggestion?: string;
  }>;
}

/**
 * Checks for basic SEO requirements
 */
export function checkSEORequirements(content: string): SEOCheckResult {
  const issues: SEOCheckResult['issues'] = [];

  // Check for meta description
  if (!content.includes('meta') || !content.includes('description')) {
    issues.push({
      type: 'warning',
      rule: 'meta-description',
      message: 'Page may be missing meta description',
      suggestion: 'Add <meta name="description" content="..."> for better SEO',
    });
  }

  // Check for title tag
  if (!content.includes('<title') && !content.includes('title=')) {
    issues.push({
      type: 'warning',
      rule: 'title-tag',
      message: 'Page may be missing title tag',
      suggestion: 'Ensure each page has a unique, descriptive title',
    });
  }

  // Check for canonical URL
  if (!content.includes('canonical')) {
    issues.push({
      type: 'warning',
      rule: 'canonical-url',
      message: 'Page may be missing canonical URL',
      suggestion: 'Add <link rel="canonical" href="..."> to prevent duplicate content issues',
    });
  }

  // Check for Open Graph tags
  if (!content.includes('og:')) {
    issues.push({
      type: 'warning',
      rule: 'open-graph',
      message: 'Page may be missing Open Graph meta tags',
      suggestion: 'Add og:title, og:description, og:image for better social sharing',
    });
  }

  return {
    valid: issues.filter((i) => i.type === 'error').length === 0,
    issues,
  };
}

/**
 * Performance optimization recommendations
 */
export function getPerformanceRecommendations(): string[] {
  return [
    'Use modern image formats (WebP, AVIF) with fallbacks',
    'Implement lazy loading for images below the fold',
    'Minimize and bundle CSS/JS files',
    'Use content hashing for cache busting',
    'Implement critical CSS inlining',
    'Preload important resources (fonts, hero images)',
    'Use async/defer for non-critical scripts',
    'Optimize web fonts (subset, preload, font-display: swap)',
    'Enable compression (gzip/brotli) on the server',
    'Implement service worker for offline support',
  ];
}
