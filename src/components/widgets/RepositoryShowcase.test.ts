/**
 * Property-based tests for repository and publication data completeness
 * Feature: portfolio-training-website, Property 11: Repository and publication data completeness
 * Validates: Requirements 9.3, 9.4
 */
import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Repository, Publication } from '~/utils/schemas';

/**
 * Helper function to simulate repository showcase rendering
 * This extracts the rendering logic that would be used in the RepositoryShowcase.astro component
 */
function renderRepositoryShowcase(
  repositories: Repository[],
  publications: Publication[]
): {
  renderedRepositories: Array<{
    name: string;
    description: string;
    url: string;
    technologies: string[];
  }>;
  renderedPublications: Array<{
    title: string;
    authors: string[];
    venue: string;
    year: number;
    hasViewLink: boolean;
    hasDownloadLink: boolean;
  }>;
} {
  // Sort repositories: featured first, then by stars
  const sortedRepositories = [...repositories].sort((a, b) => {
    if (a.featured !== b.featured) return b.featured ? 1 : -1;
    return (b.stars || 0) - (a.stars || 0);
  });

  // Sort publications by year (newest first)
  const sortedPublications = [...publications].sort((a, b) => b.year - a.year);

  const renderedRepositories = sortedRepositories.map((repo) => ({
    name: repo.name,
    description: repo.description,
    url: repo.url,
    technologies: repo.technologies,
  }));

  const renderedPublications = sortedPublications.map((pub) => ({
    title: pub.title,
    authors: pub.authors,
    venue: pub.venue,
    year: pub.year,
    hasViewLink: !!pub.url,
    hasDownloadLink: !!pub.downloadUrl,
  }));

  return {
    renderedRepositories,
    renderedPublications,
  };
}

describe('Repository and Publication Data Completeness - Property Tests', () => {
  /**
   * Property 11: Repository and publication data completeness
   * For any repository or publication in the data files, all required fields
   * (name, description, URL for repositories; title, authors, venue for publications)
   * should be rendered in the portfolio section
   */

  // Generator for valid repository data
  const repositoryArbitrary: fc.Arbitrary<Repository> = fc.record({
    name: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
    description: fc.string({ minLength: 1, maxLength: 500 }).filter(s => s.trim().length > 0),
    url: fc.webUrl(),
    technologies: fc.array(fc.string({ minLength: 1, maxLength: 30 }).filter(s => s.trim().length > 0), { minLength: 0, maxLength: 10 }),
    featured: fc.boolean(),
    stars: fc.option(fc.integer({ min: 0, max: 100000 }), { nil: undefined }),
  });

  // Generator for valid publication data
  const publicationArbitrary: fc.Arbitrary<Publication> = fc.record({
    title: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
    authors: fc.array(fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0), { minLength: 1, maxLength: 10 }),
    venue: fc.string({ minLength: 1, maxLength: 200 }).filter(s => s.trim().length > 0),
    year: fc.integer({ min: 1900, max: 2100 }),
    url: fc.option(fc.webUrl(), { nil: undefined }),
    downloadUrl: fc.option(fc.webUrl(), { nil: undefined }),
    abstract: fc.option(fc.string({ minLength: 1, maxLength: 1000 }), { nil: undefined }),
  });

  describe('Repository Data Completeness', () => {
    it('should render all required repository fields (name, description, URL)', () => {
      fc.assert(
        fc.property(
          fc.array(repositoryArbitrary, { minLength: 1, maxLength: 10 }),
          (repositories) => {
            const { renderedRepositories } = renderRepositoryShowcase(repositories, []);
            
            // All repositories should be rendered
            expect(renderedRepositories.length).toBe(repositories.length);
            
            // Each rendered repository should have all required fields
            // Match by name AND url to handle duplicates
            renderedRepositories.forEach((rendered) => {
              const source = repositories.find(r => r.name === rendered.name && r.url === rendered.url);
              expect(source).toBeDefined();
              expect(rendered.name).toBe(source!.name);
              expect(rendered.description).toBe(source!.description);
              expect(rendered.url).toBe(source!.url);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should render all technology tags for each repository', () => {
      fc.assert(
        fc.property(
          fc.array(repositoryArbitrary, { minLength: 1, maxLength: 10 }),
          (repositories) => {
            const { renderedRepositories } = renderRepositoryShowcase(repositories, []);
            
            // Match by name AND url to handle duplicates
            renderedRepositories.forEach((rendered) => {
              const source = repositories.find(r => r.name === rendered.name && r.url === rendered.url);
              expect(source).toBeDefined();
              expect(rendered.technologies).toEqual(source!.technologies);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain count invariant: all repositories are rendered', () => {
      fc.assert(
        fc.property(
          fc.array(repositoryArbitrary, { minLength: 0, maxLength: 20 }),
          (repositories) => {
            const { renderedRepositories } = renderRepositoryShowcase(repositories, []);
            expect(renderedRepositories.length).toBe(repositories.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Publication Data Completeness', () => {
    it('should render all required publication fields (title, authors, venue)', () => {
      fc.assert(
        fc.property(
          fc.array(publicationArbitrary, { minLength: 1, maxLength: 10 }),
          (publications) => {
            const { renderedPublications } = renderRepositoryShowcase([], publications);
            
            // All publications should be rendered
            expect(renderedPublications.length).toBe(publications.length);
            
            // Each rendered publication should have all required fields
            // Match by title AND year to handle duplicates
            renderedPublications.forEach((rendered) => {
              const source = publications.find(p => p.title === rendered.title && p.year === rendered.year);
              expect(source).toBeDefined();
              expect(rendered.title).toBe(source!.title);
              expect(rendered.authors).toEqual(source!.authors);
              expect(rendered.venue).toBe(source!.venue);
              expect(rendered.year).toBe(source!.year);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly indicate presence of view and download links', () => {
      fc.assert(
        fc.property(
          fc.array(publicationArbitrary, { minLength: 1, maxLength: 10 }),
          (publications) => {
            const { renderedPublications } = renderRepositoryShowcase([], publications);
            
            // Match by title AND year to handle duplicates
            renderedPublications.forEach((rendered) => {
              const source = publications.find(p => p.title === rendered.title && p.year === rendered.year);
              expect(source).toBeDefined();
              expect(rendered.hasViewLink).toBe(!!source!.url);
              expect(rendered.hasDownloadLink).toBe(!!source!.downloadUrl);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain count invariant: all publications are rendered', () => {
      fc.assert(
        fc.property(
          fc.array(publicationArbitrary, { minLength: 0, maxLength: 20 }),
          (publications) => {
            const { renderedPublications } = renderRepositoryShowcase([], publications);
            expect(renderedPublications.length).toBe(publications.length);
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Combined Repository and Publication Rendering', () => {
    it('should render both repositories and publications when both are provided', () => {
      fc.assert(
        fc.property(
          fc.array(repositoryArbitrary, { minLength: 1, maxLength: 5 }),
          fc.array(publicationArbitrary, { minLength: 1, maxLength: 5 }),
          (repositories, publications) => {
            const { renderedRepositories, renderedPublications } = renderRepositoryShowcase(
              repositories,
              publications
            );
            
            expect(renderedRepositories.length).toBe(repositories.length);
            expect(renderedPublications.length).toBe(publications.length);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle empty arrays gracefully', () => {
      const { renderedRepositories, renderedPublications } = renderRepositoryShowcase([], []);
      expect(renderedRepositories).toEqual([]);
      expect(renderedPublications).toEqual([]);
    });
  });
});
