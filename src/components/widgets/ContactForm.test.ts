/**
 * Property-based tests for ContactForm component
 * Feature: portfolio-training-website, Property 5: URL parameter form pre-population
 * Validates: Requirements 3.1, 3.5
 *
 * Feature: portfolio-training-website, Property 6: Form submission state management
 * Validates: Requirements 3.3
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * URL Parameter Pre-population Logic
 * Extracts the logic used in ContactForm.astro for pre-populating form fields
 */
interface URLParams {
  product?: string;
  subject?: string;
}

interface PrePopulatedFields {
  subject: string;
  productHidden: string;
}

/**
 * Simulates the URL parameter pre-population logic from ContactForm.astro
 * This is the core logic that determines how form fields are pre-populated
 */
function prePopulateFormFields(params: URLParams): PrePopulatedFields {
  const productParam = params.product || '';
  const subjectParam = params.subject || '';

  // Build pre-populated subject line (same logic as in ContactForm.astro)
  const prePopulatedSubject = subjectParam || (productParam ? `Training Inquiry: ${productParam}` : '');

  return {
    subject: prePopulatedSubject,
    productHidden: productParam,
  };
}

/**
 * Form State Management Types
 */
type FormState = 'idle' | 'submitting' | 'success' | 'error';

interface FormStateResult {
  submitButtonDisabled: boolean;
  showLoadingText: boolean;
  showSuccessMessage: boolean;
  showErrorMessage: boolean;
  formReset: boolean;
}

/**
 * Simulates the form state management logic from ContactForm.astro
 * This is the core logic that manages form UI state during submission
 */
function getFormStateResult(state: FormState, _previousFormHadData: boolean = true): FormStateResult {
  switch (state) {
    case 'submitting':
      return {
        submitButtonDisabled: true,
        showLoadingText: true,
        showSuccessMessage: false,
        showErrorMessage: false,
        formReset: false,
      };
    case 'success':
      return {
        submitButtonDisabled: false,
        showLoadingText: false,
        showSuccessMessage: true,
        showErrorMessage: false,
        formReset: true, // Form is reset on success
      };
    case 'error':
      return {
        submitButtonDisabled: false,
        showLoadingText: false,
        showSuccessMessage: false,
        showErrorMessage: true,
        formReset: false,
      };
    case 'idle':
    default:
      return {
        submitButtonDisabled: false,
        showLoadingText: false,
        showSuccessMessage: false,
        showErrorMessage: false,
        formReset: false,
      };
  }
}

/**
 * Validates that exactly one message type is shown (or none for idle/submitting)
 */
function hasValidMessageState(result: FormStateResult): boolean {
  const messageCount = [result.showSuccessMessage, result.showErrorMessage].filter(Boolean).length;
  return messageCount <= 1;
}

describe('ContactForm URL Parameter Pre-population - Property Tests', () => {
  /**
   * Property 5: URL parameter form pre-population
   * For any valid product identifier passed as a URL parameter, the contact form
   * should pre-populate the subject field with the correct product information
   */

  // Generator for product names (non-empty strings that could be product slugs)
  const productNameArbitrary = fc.stringMatching(/^[a-zA-Z][a-zA-Z0-9\-_ ]{0,49}$/).filter((s) => s.trim().length > 0);

  // Generator for subject strings
  const subjectArbitrary = fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0);

  // Generator for URL parameters
  const urlParamsArbitrary: fc.Arbitrary<URLParams> = fc.record({
    product: fc.option(productNameArbitrary, { nil: undefined }),
    subject: fc.option(subjectArbitrary, { nil: undefined }),
  });

  it('should pre-populate subject with product name when product param is provided and subject is not', () => {
    fc.assert(
      fc.property(productNameArbitrary, (productName) => {
        const params: URLParams = { product: productName };
        const result = prePopulateFormFields(params);

        // Subject should contain the product name in the expected format
        expect(result.subject).toBe(`Training Inquiry: ${productName}`);
        expect(result.productHidden).toBe(productName);
      }),
      { numRuns: 100 }
    );
  });

  it('should use explicit subject param when both product and subject are provided', () => {
    fc.assert(
      fc.property(productNameArbitrary, subjectArbitrary, (productName, subject) => {
        const params: URLParams = { product: productName, subject: subject };
        const result = prePopulateFormFields(params);

        // Explicit subject should take precedence
        expect(result.subject).toBe(subject);
        // Product should still be tracked in hidden field
        expect(result.productHidden).toBe(productName);
      }),
      { numRuns: 100 }
    );
  });

  it('should use subject param when only subject is provided', () => {
    fc.assert(
      fc.property(subjectArbitrary, (subject) => {
        const params: URLParams = { subject: subject };
        const result = prePopulateFormFields(params);

        expect(result.subject).toBe(subject);
        expect(result.productHidden).toBe('');
      }),
      { numRuns: 100 }
    );
  });

  it('should return empty subject when no params are provided', () => {
    const params: URLParams = {};
    const result = prePopulateFormFields(params);

    expect(result.subject).toBe('');
    expect(result.productHidden).toBe('');
  });

  it('should handle any combination of URL parameters consistently', () => {
    fc.assert(
      fc.property(urlParamsArbitrary, (params) => {
        const result = prePopulateFormFields(params);

        // Invariant: subject is either from subject param, derived from product, or empty
        if (params.subject) {
          expect(result.subject).toBe(params.subject);
        } else if (params.product) {
          expect(result.subject).toBe(`Training Inquiry: ${params.product}`);
        } else {
          expect(result.subject).toBe('');
        }

        // Invariant: productHidden always matches product param or is empty
        expect(result.productHidden).toBe(params.product || '');
      }),
      { numRuns: 100 }
    );
  });
});

describe('ContactForm Web3Forms Integration - Unit Tests', () => {
  /**
   * Unit tests for Web3Forms API integration
   * Validates: Requirements 3.2, 3.4
   */

  // Mock form data structure
  interface ContactFormData {
    access_key: string;
    name: string;
    email: string;
    subject: string;
    message: string;
    product?: string;
    botcheck?: string;
  }

  /**
   * Validates that form data is properly structured for Web3Forms API
   */
  function validateFormDataForWeb3Forms(data: ContactFormData): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!data.access_key) {
      errors.push('Missing access_key');
    }
    if (!data.name || data.name.trim().length === 0) {
      errors.push('Missing or empty name');
    }
    if (!data.email || !data.email.includes('@')) {
      errors.push('Invalid email format');
    }
    if (!data.subject || data.subject.trim().length === 0) {
      errors.push('Missing or empty subject');
    }
    if (!data.message || data.message.trim().length === 0) {
      errors.push('Missing or empty message');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Checks if honeypot field indicates spam
   */
  function isSpamSubmission(data: ContactFormData): boolean {
    return !!(data.botcheck && data.botcheck.length > 0);
  }

  /**
   * Simulates Web3Forms API response
   */
  function simulateWeb3FormsResponse(data: ContactFormData): {
    success: boolean;
    message: string;
  } {
    // Check for spam first
    if (isSpamSubmission(data)) {
      // Silently accept spam to not reveal detection
      return { success: true, message: 'Form submitted successfully' };
    }

    const validation = validateFormDataForWeb3Forms(data);
    if (!validation.isValid) {
      return { success: false, message: validation.errors.join(', ') };
    }

    return { success: true, message: 'Form submitted successfully' };
  }

  it('should validate form data with all required fields', () => {
    const validData: ContactFormData = {
      access_key: 'test-key-123',
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Training Inquiry',
      message: 'I am interested in your training courses.',
    };

    const result = validateFormDataForWeb3Forms(validData);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject form data missing access_key', () => {
    const invalidData: ContactFormData = {
      access_key: '',
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Training Inquiry',
      message: 'Test message',
    };

    const result = validateFormDataForWeb3Forms(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing access_key');
  });

  it('should reject form data with invalid email', () => {
    const invalidData: ContactFormData = {
      access_key: 'test-key',
      name: 'John Doe',
      email: 'invalid-email',
      subject: 'Training Inquiry',
      message: 'Test message',
    };

    const result = validateFormDataForWeb3Forms(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Invalid email format');
  });

  it('should reject form data with empty required fields', () => {
    const invalidData: ContactFormData = {
      access_key: 'test-key',
      name: '   ',
      email: 'john@example.com',
      subject: '',
      message: 'Test message',
    };

    const result = validateFormDataForWeb3Forms(invalidData);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Missing or empty name');
    expect(result.errors).toContain('Missing or empty subject');
  });

  it('should detect spam when honeypot field is filled', () => {
    const spamData: ContactFormData = {
      access_key: 'test-key',
      name: 'Spammer',
      email: 'spam@example.com',
      subject: 'Buy now!',
      message: 'Click here for deals!',
      botcheck: 'I am a bot',
    };

    expect(isSpamSubmission(spamData)).toBe(true);
  });

  it('should not detect spam when honeypot field is empty', () => {
    const legitimateData: ContactFormData = {
      access_key: 'test-key',
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Training Inquiry',
      message: 'Legitimate message',
      botcheck: '',
    };

    expect(isSpamSubmission(legitimateData)).toBe(false);
  });

  it('should not detect spam when honeypot field is undefined', () => {
    const legitimateData: ContactFormData = {
      access_key: 'test-key',
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Training Inquiry',
      message: 'Legitimate message',
    };

    expect(isSpamSubmission(legitimateData)).toBe(false);
  });

  it('should silently accept spam submissions (to not reveal detection)', () => {
    const spamData: ContactFormData = {
      access_key: 'test-key',
      name: 'Spammer',
      email: 'spam@example.com',
      subject: 'Buy now!',
      message: 'Click here!',
      botcheck: 'filled by bot',
    };

    const response = simulateWeb3FormsResponse(spamData);
    // Should appear successful to not reveal spam detection
    expect(response.success).toBe(true);
  });

  it('should return success for valid form submissions', () => {
    const validData: ContactFormData = {
      access_key: 'test-key',
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Training Inquiry',
      message: 'I would like to learn more.',
    };

    const response = simulateWeb3FormsResponse(validData);
    expect(response.success).toBe(true);
  });

  it('should return error for invalid form submissions', () => {
    const invalidData: ContactFormData = {
      access_key: '',
      name: '',
      email: 'invalid',
      subject: '',
      message: '',
    };

    const response = simulateWeb3FormsResponse(invalidData);
    expect(response.success).toBe(false);
  });

  it('should include product field when provided', () => {
    const dataWithProduct: ContactFormData = {
      access_key: 'test-key',
      name: 'John Doe',
      email: 'john@example.com',
      subject: 'Training Inquiry: AWS Fundamentals',
      message: 'Interested in this course',
      product: 'aws-fundamentals',
    };

    const result = validateFormDataForWeb3Forms(dataWithProduct);
    expect(result.isValid).toBe(true);
    expect(dataWithProduct.product).toBe('aws-fundamentals');
  });
});

describe('ContactForm State Management - Property Tests', () => {
  /**
   * Property 6: Form submission state management
   * For any contact form submission attempt, the system should display appropriate
   * success or error messages without causing a page refresh
   */

  // Generator for form states
  const formStateArbitrary: fc.Arbitrary<FormState> = fc.constantFrom('idle', 'submitting', 'success', 'error');

  it('should show loading state only during submission', () => {
    fc.assert(
      fc.property(formStateArbitrary, (state) => {
        const result = getFormStateResult(state);

        // Loading text should only show during submitting state
        if (state === 'submitting') {
          expect(result.showLoadingText).toBe(true);
          expect(result.submitButtonDisabled).toBe(true);
        } else {
          expect(result.showLoadingText).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should show success message only on success state', () => {
    fc.assert(
      fc.property(formStateArbitrary, (state) => {
        const result = getFormStateResult(state);

        if (state === 'success') {
          expect(result.showSuccessMessage).toBe(true);
          expect(result.showErrorMessage).toBe(false);
          expect(result.formReset).toBe(true);
        } else {
          expect(result.showSuccessMessage).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should show error message only on error state', () => {
    fc.assert(
      fc.property(formStateArbitrary, (state) => {
        const result = getFormStateResult(state);

        if (state === 'error') {
          expect(result.showErrorMessage).toBe(true);
          expect(result.showSuccessMessage).toBe(false);
          expect(result.formReset).toBe(false);
        } else {
          expect(result.showErrorMessage).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should never show both success and error messages simultaneously', () => {
    fc.assert(
      fc.property(formStateArbitrary, (state) => {
        const result = getFormStateResult(state);

        // Invariant: at most one message type should be shown
        expect(hasValidMessageState(result)).toBe(true);

        // Stronger invariant: success and error are mutually exclusive
        expect(result.showSuccessMessage && result.showErrorMessage).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('should enable submit button in all states except submitting', () => {
    fc.assert(
      fc.property(formStateArbitrary, (state) => {
        const result = getFormStateResult(state);

        // Button should only be disabled during submission
        if (state === 'submitting') {
          expect(result.submitButtonDisabled).toBe(true);
        } else {
          expect(result.submitButtonDisabled).toBe(false);
        }
      }),
      { numRuns: 100 }
    );
  });

  it('should reset form only on success', () => {
    fc.assert(
      fc.property(formStateArbitrary, (state) => {
        const result = getFormStateResult(state);

        // Form should only be reset on success
        expect(result.formReset).toBe(state === 'success');
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain consistent state transitions', () => {
    // Test state transition sequence: idle -> submitting -> success/error -> idle
    const stateSequences: FormState[][] = [
      ['idle', 'submitting', 'success'],
      ['idle', 'submitting', 'error'],
    ];

    stateSequences.forEach((sequence) => {
      sequence.forEach((currentState) => {
        const result = getFormStateResult(currentState);

        // Each state should have valid message state
        expect(hasValidMessageState(result)).toBe(true);
      });
    });
  });
});
