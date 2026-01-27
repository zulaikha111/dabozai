# Design Document: AI Course Detail Pages

## Overview

This design describes the implementation of detail pages for all three training courses on the services page. The solution leverages the existing Astro content collection system (`products`) and the existing product detail page template (`src/pages/products/[...slug].astro`). The primary work involves creating course data files and updating the services page to make course cards clickable.

## Architecture

The implementation follows the existing architecture pattern:

```
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│   Services Page     │────▶│   Products Slug      │────▶│   Course Detail     │
│   /services         │     │   /products/[slug]   │     │   Page Rendered     │
└─────────────────────┘     └──────────────────────┘     └─────────────────────┘
         │                           │
         │                           │
         ▼                           ▼
┌─────────────────────┐     ┌──────────────────────┐
│   Features2 Widget  │     │   Products Collection │
│   (Course Cards)    │     │   src/data/products/  │
└─────────────────────┘     └──────────────────────┘
```

## Components and Interfaces

### Course Data Files

Three markdown files in `src/data/products/`:

1. **ai-systems-from-prompts-to-agents.md** - Full course content
2. **building-ai-agents.md** - Placeholder content
3. **rag-systems-masterclass.md** - Placeholder content

### Frontmatter Schema (existing)

```typescript
interface CourseData {
  title: string;
  description: string;
  duration: string;
  price?: number;
  image: string;
  featured: boolean;
  category: string;
  prerequisites?: string[];
  learningOutcomes: string[];
}
```

### Services Page Updates

The `Features2` widget items need `href` properties added to make cards clickable:

```typescript
interface CourseCardItem {
  title: string;
  description: string;
  icon: string;
  href: string; // NEW: Link to detail page
}
```

### Existing Detail Page Template

The `src/pages/products/[...slug].astro` already provides:

- Breadcrumb navigation (includes link back to /services)
- Course metadata display (duration, price)
- Learning outcomes section
- Prerequisites section
- Markdown content rendering
- Contact CTA at bottom with pre-populated subject
- Testimonials section (if available)

## Data Models

### AI Systems Course File Structure

```yaml
---
title: 'AI Systems: From Prompts to Agents'
description: 'A hands-on, three-day training that teaches how modern AI systems actually work—and how to design them properly.'
duration: '2-3 days'
price: 1
image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80'
featured: true
category: 'AI Training'
prerequisites:
  - 'No programming experience required for Days 1-2'
  - 'Basic Python knowledge required for Day 3'
  - 'Laptop with macOS 12+ or Windows 10+ (64-bit)'
learningOutcomes:
  - 'Explain how modern AI models work at a system level'
  - 'Design clear specifications before building anything'
  - 'Turn natural-language intent into structured AI workflows'
  - 'Understand and apply memory, tools, and agent logic'
  - 'Build and reason about autonomous AI agents'
---
[Full markdown content from AI_Course.md]
```

### Placeholder Course File Structure

```yaml
---
title: 'Building AI Agents'
description: 'Master autonomous AI agents using LangChain and custom architectures.'
duration: '3 days'
image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80'
featured: false
category: 'AI Training'
prerequisites:
  - 'Python programming experience'
learningOutcomes:
  - 'Course details coming soon'
---
## Coming Soon

Course details will be available soon. Please contact us for more information.
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Course Files Exist in Collection

_For all_ expected course slugs (ai-systems-from-prompts-to-agents, building-ai-agents, rag-systems-masterclass), the products collection SHALL contain a corresponding markdown file.

**Validates: Requirements 1.1, 2.1, 3.1**

### Property 2: Course Frontmatter Schema Compliance

_For all_ course files in the products collection, the frontmatter SHALL contain all required fields: title (string), description (string), duration (string), image (string), category (string), and learningOutcomes (array).

**Validates: Requirements 1.2, 2.2, 3.2**

### Property 3: Services Page Course Links

_For all_ courses displayed on the services page, the course card SHALL contain an href attribute matching the pattern `/products/{course-slug}`.

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 4: Contact Link Query Parameters

_For all_ course detail pages, the contact CTA link SHALL include query parameters with the course identifier and subject line.

**Validates: Requirements 5.3**

## Error Handling

### Missing Course Files

If a course file is missing from the products collection:

- The build process will fail during static generation
- Astro's `getCollection` will not include the missing course
- The services page link will result in a 404

### Invalid Frontmatter

If frontmatter is invalid or missing required fields:

- Astro's content collection validation will fail at build time
- The schema defined in `src/content/config.ts` enforces required fields

### Missing Images

If course images fail to load:

- The existing template uses standard `<img>` tags with alt text
- Broken images will show alt text as fallback

## Testing Strategy

### Unit Tests

Unit tests will verify:

- Course data files exist and are readable
- Frontmatter contains required fields
- Services page configuration includes course links
- Contact URL generation includes proper query parameters

### Property-Based Tests

Property tests will verify:

- All expected courses exist in the collection
- All course frontmatter complies with the schema
- All services page course items have valid hrefs

### Test Configuration

- Framework: Vitest (already configured in project)
- Test file location: `src/utils/coursePages.test.ts`
- Minimum iterations for property tests: 100 (though with 3 courses, exhaustive testing is practical)

### Test Annotations

Each property test will be annotated with:

- **Feature: ai-course-detail-page, Property {N}: {property description}**
- **Validates: Requirements X.Y**
