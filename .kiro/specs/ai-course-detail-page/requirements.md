# Requirements Document

## Introduction

This feature adds detail pages for all three training courses on the services page. When users click on any course, they will be taken to a dedicated detail page. The "AI Systems: From Prompts to Agents" course displays full content from AI_Course.md, while "Building AI Agents" and "RAG Systems Masterclass" display placeholder "coming soon" content. All detail pages include contact links at the top and bottom.

## Glossary

- **Course_Detail_Page**: A dedicated page displaying comprehensive information about a specific training course
- **Services_Page**: The main training and services listing page at /services
- **Products_Collection**: The Astro content collection that stores course/product data
- **Contact_Link**: A navigation element that directs users to the contact page for inquiries
- **Placeholder_Content**: Temporary content indicating course details will be available soon

## Requirements

### Requirement 1: Create AI Systems Course Data File

**User Story:** As a content manager, I want the AI Systems course content stored in the products collection, so that it can be rendered as a detail page.

#### Acceptance Criteria

1. THE Products_Collection SHALL contain a markdown file for the "AI Systems: From Prompts to Agents" course
2. WHEN the course file is created, THE system SHALL include all required frontmatter fields (title, description, duration, price, image, category, prerequisites, learningOutcomes)
3. THE course file SHALL contain the full course content from AI_Course.md formatted as markdown body content

### Requirement 2: Create Building AI Agents Course Data File

**User Story:** As a content manager, I want a placeholder course file for "Building AI Agents", so that users can see the course exists with details coming soon.

#### Acceptance Criteria

1. THE Products_Collection SHALL contain a markdown file for the "Building AI Agents" course
2. THE course file SHALL include required frontmatter fields with appropriate placeholder values
3. THE course body content SHALL display "Course details will be available soon" message

### Requirement 3: Create RAG Systems Masterclass Course Data File

**User Story:** As a content manager, I want a placeholder course file for "RAG Systems Masterclass", so that users can see the course exists with details coming soon.

#### Acceptance Criteria

1. THE Products_Collection SHALL contain a markdown file for the "RAG Systems Masterclass" course
2. THE course file SHALL include required frontmatter fields with appropriate placeholder values
3. THE course body content SHALL display "Course details will be available soon" message

### Requirement 4: Link All Courses from Services Page

**User Story:** As a website visitor, I want to click on any course card on the services page, so that I can view course information.

#### Acceptance Criteria

1. WHEN a user views the services page, EACH course card SHALL display a clickable link to its detail page
2. WHEN a user clicks on the "AI Systems: From Prompts to Agents" card, THE system SHALL navigate to /products/ai-systems-from-prompts-to-agents
3. WHEN a user clicks on the "Building AI Agents" card, THE system SHALL navigate to /products/building-ai-agents
4. WHEN a user clicks on the "RAG Systems Masterclass" card, THE system SHALL navigate to /products/rag-systems-masterclass
5. THE course cards SHALL display consistent information with their respective detail pages

### Requirement 5: Display Contact Links on Detail Pages

**User Story:** As a potential customer, I want easy access to contact options on course detail pages, so that I can inquire about training.

#### Acceptance Criteria

1. WHEN a user views any course detail page, THE system SHALL display a contact link in the top navigation area
2. WHEN a user views any course detail page, THE system SHALL display a contact call-to-action at the bottom of the page
3. THE contact links SHALL navigate to the /contact page with pre-populated course information

### Requirement 6: Format Course Content Properly

**User Story:** As a website visitor, I want the course content displayed in a readable, well-formatted layout, so that I can easily understand the course details.

#### Acceptance Criteria

1. THE Course_Detail_Page SHALL render all markdown content with proper heading hierarchy
2. THE Course_Detail_Page SHALL display course metadata (duration, price, prerequisites, learning outcomes) in structured sections
3. THE Course_Detail_Page SHALL maintain consistent styling with the rest of the website

### Requirement 7: Ensure Test Coverage

**User Story:** As a developer, I want tests to verify the course detail page functionality, so that I can ensure the feature works correctly.

#### Acceptance Criteria

1. THE test suite SHALL include tests verifying all three course data files exist
2. THE test suite SHALL include tests verifying the services page links to all courses
3. WHEN tests are run, THE system SHALL validate that required frontmatter fields are present for each course
