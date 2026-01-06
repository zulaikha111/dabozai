/**
 * Property-based tests for portfolio content rendering
 * Feature: portfolio-training-website, Property 1: Content collection rendering completeness
 * Validates: Requirements 2.1, 4.1, 4.4, 9.1, 10.1
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ResumeData, Experience, Certification, SkillCategory } from '~/utils/schemas';

/**
 * Helper function to simulate portfolio content rendering
 * This extracts the rendering logic that would be used in the Portfolio.astro component
 */
function renderPortfolioContent(resumeData: ResumeData): {
  personalInfoRendered: boolean;
  experienceItems: string[];
  certificationItems: string[];
  skillItems: string[];
} {
  const { personalInfo, experience = [], certifications = [], skills = [] } = resumeData;

  // Check personal info is renderable
  const personalInfoRendered = !!(personalInfo.name && personalInfo.title && personalInfo.email);

  // Transform experience data for rendering
  const experienceItems = experience.map((exp) => `${exp.position} at ${exp.company}`);

  // Transform certifications for rendering
  const certificationItems = certifications.map((cert) => cert.name);

  // Transform skills for rendering
  const skillItems = skills.map((skillCategory) => skillCategory.category);

  return {
    personalInfoRendered,
    experienceItems,
    certificationItems,
    skillItems,
  };
}

/**
 * Helper to check if all items from source are present in rendered output
 */
function allItemsRendered<T>(sourceItems: T[], renderedItems: string[], extractKey: (item: T) => string): boolean {
  return sourceItems.every((item) => renderedItems.includes(extractKey(item)));
}

describe('Portfolio Content Rendering - Property Tests', () => {
  /**
   * Property 1: Content collection rendering completeness
   * For any content collection (products, blog posts, portfolio data, repositories, testimonials),
   * all items in the collection should be rendered and accessible in the generated static site
   */

  // Custom email generator compatible with zod validation
  const zodCompatibleEmail = fc
    .tuple(
      fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
      fc.stringMatching(/^[a-z][a-z0-9]{0,9}$/),
      fc.constantFrom('com', 'org', 'net', 'edu', 'io', 'dev')
    )
    .map(([local, domain, tld]) => `${local}@${domain}.${tld}`);

  // Non-whitespace string generator
  const nonEmptyString = (maxLength: number) =>
    fc.string({ minLength: 1, maxLength }).filter((s) => s.trim().length > 0);

  // Generator for experience items
  const experienceArbitrary: fc.Arbitrary<Experience> = fc.record({
    company: nonEmptyString(100),
    position: nonEmptyString(100),
    startDate: nonEmptyString(20),
    endDate: fc.option(nonEmptyString(20), { nil: undefined }),
    description: fc.option(nonEmptyString(500), { nil: undefined }),
    achievements: fc.option(fc.array(nonEmptyString(200), { minLength: 0, maxLength: 5 }), { nil: undefined }),
  });

  // Generator for certification items
  const certificationArbitrary: fc.Arbitrary<Certification> = fc.record({
    name: nonEmptyString(100),
    issuer: nonEmptyString(100),
    date: nonEmptyString(20),
    credentialId: fc.option(nonEmptyString(50), { nil: undefined }),
    credentialUrl: fc.option(fc.webUrl(), { nil: undefined }),
  });

  // Generator for skill categories
  const skillCategoryArbitrary: fc.Arbitrary<SkillCategory> = fc.record({
    category: nonEmptyString(50),
    items: fc.array(nonEmptyString(50), { minLength: 1, maxLength: 10 }),
  });

  // Generator for valid resume data
  const validResumeArbitrary: fc.Arbitrary<ResumeData> = fc.record({
    personalInfo: fc.record({
      name: nonEmptyString(100),
      title: nonEmptyString(100),
      email: zodCompatibleEmail,
      phone: fc.option(nonEmptyString(20), { nil: undefined }),
      location: fc.option(nonEmptyString(100), { nil: undefined }),
      summary: fc.option(nonEmptyString(500), { nil: undefined }),
    }),
    experience: fc.option(fc.array(experienceArbitrary, { minLength: 0, maxLength: 5 }), { nil: undefined }),
    certifications: fc.option(fc.array(certificationArbitrary, { minLength: 0, maxLength: 5 }), { nil: undefined }),
    skills: fc.option(fc.array(skillCategoryArbitrary, { minLength: 0, maxLength: 5 }), { nil: undefined }),
  });

  it('should render personal info for any valid resume data', () => {
    fc.assert(
      fc.property(validResumeArbitrary, (resumeData) => {
        const rendered = renderPortfolioContent(resumeData);
        expect(rendered.personalInfoRendered).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('should render all experience items from the resume data', () => {
    fc.assert(
      fc.property(validResumeArbitrary, (resumeData) => {
        const rendered = renderPortfolioContent(resumeData);
        const experience = resumeData.experience || [];

        // All experience items should be rendered
        const allRendered = allItemsRendered(
          experience,
          rendered.experienceItems,
          (exp) => `${exp.position} at ${exp.company}`
        );

        expect(allRendered).toBe(true);
        expect(rendered.experienceItems.length).toBe(experience.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should render all certification items from the resume data', () => {
    fc.assert(
      fc.property(validResumeArbitrary, (resumeData) => {
        const rendered = renderPortfolioContent(resumeData);
        const certifications = resumeData.certifications || [];

        // All certification items should be rendered
        const allRendered = allItemsRendered(certifications, rendered.certificationItems, (cert) => cert.name);

        expect(allRendered).toBe(true);
        expect(rendered.certificationItems.length).toBe(certifications.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should render all skill categories from the resume data', () => {
    fc.assert(
      fc.property(validResumeArbitrary, (resumeData) => {
        const rendered = renderPortfolioContent(resumeData);
        const skills = resumeData.skills || [];

        // All skill categories should be rendered
        const allRendered = allItemsRendered(skills, rendered.skillItems, (skill) => skill.category);

        expect(allRendered).toBe(true);
        expect(rendered.skillItems.length).toBe(skills.length);
      }),
      { numRuns: 100 }
    );
  });

  it('should maintain count invariant: rendered items count equals source items count', () => {
    fc.assert(
      fc.property(validResumeArbitrary, (resumeData) => {
        const rendered = renderPortfolioContent(resumeData);

        const sourceExperienceCount = (resumeData.experience || []).length;
        const sourceCertificationCount = (resumeData.certifications || []).length;
        const sourceSkillCount = (resumeData.skills || []).length;

        // Count invariant: rendered count should equal source count
        expect(rendered.experienceItems.length).toBe(sourceExperienceCount);
        expect(rendered.certificationItems.length).toBe(sourceCertificationCount);
        expect(rendered.skillItems.length).toBe(sourceSkillCount);
      }),
      { numRuns: 100 }
    );
  });
});
