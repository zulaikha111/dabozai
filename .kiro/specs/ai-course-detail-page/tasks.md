# Implementation Plan: AI Course Detail Pages

## Overview

This implementation adds detail pages for all three training courses by creating course data files in the products collection and updating the services page to make course cards clickable. The existing product detail page template handles rendering.

## Tasks

- [x] 1. Create AI Systems course data file
  - [x] 1.1 Create `src/data/products/ai-systems-from-prompts-to-agents.md` with full content from AI_Course.md
    - Include frontmatter: title, description, duration, price, image, category, prerequisites, learningOutcomes
    - Copy and format markdown body content from AI_Course.md
    - _Requirements: 1.1, 1.2, 1.3_

- [x] 2. Create placeholder course data files
  - [x] 2.1 Create `src/data/products/building-ai-agents.md` with placeholder content
    - Include frontmatter with appropriate values
    - Add "Coming Soon" body content
    - _Requirements: 2.1, 2.2, 2.3_
  - [x] 2.2 Create `src/data/products/rag-systems-masterclass.md` with placeholder content
    - Include frontmatter with appropriate values
    - Add "Coming Soon" body content
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Update services page with course links
  - [x] 3.1 Add href properties to Features2 course items in `src/pages/services.astro`
    - AI Systems: `/products/ai-systems-from-prompts-to-agents`
    - Building AI Agents: `/products/building-ai-agents`
    - RAG Systems: `/products/rag-systems-masterclass`
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 4. Checkpoint - Verify pages render correctly
  - Build the project and verify all three course detail pages render
  - Verify services page links navigate to correct detail pages
  - Verify contact CTAs appear at top (breadcrumb) and bottom of detail pages

- [x] 5. Write tests for course data files
  - [x] 5.1 Create `src/utils/coursePages.test.ts` with course file validation tests
    - Test that all three course files exist
    - Test frontmatter schema compliance
    - _Requirements: 7.1, 7.3_
  - [x] 5.2 Write property test for course file existence
    - **Property 1: Course Files Exist in Collection**
    - **Validates: Requirements 1.1, 2.1, 3.1**
  - [x] 5.3 Write property test for frontmatter schema compliance
    - **Property 2: Course Frontmatter Schema Compliance**
    - **Validates: Requirements 1.2, 2.2, 3.2**

- [x] 6. Write tests for services page links
  - [x] 6.1 Add tests verifying services page course links
    - Test that each course has correct href
    - _Requirements: 7.2_
  - [x] 6.2 Write property test for services page course links
    - **Property 3: Services Page Course Links**
    - **Validates: Requirements 4.1, 4.2, 4.3, 4.4**

- [x] 7. Final checkpoint - Run all tests
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- All tasks including property-based tests are required
- The existing `src/pages/products/[...slug].astro` template already handles contact CTAs (Requirements 5.1, 5.2, 5.3)
- Course images use Unsplash URLs for placeholder images
- The sample-training-course.md file can be removed or kept as reference
