import path from 'path';
import { fileURLToPath } from 'url';

import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import mdx from '@astrojs/mdx';
import partytown from '@astrojs/partytown';
import icon from 'astro-icon';
import compress from 'astro-compress';
import type { AstroIntegration } from 'astro';

import astrowind from './vendor/integration';

import { readingTimeRemarkPlugin, responsiveTablesRehypePlugin, lazyImagesRehypePlugin } from './src/utils/frontmatter';
import { validateAllContent } from './src/utils/contentValidator';

// Content validation integration for build process
// Validates: Requirements 6.1, 6.3
function contentValidationIntegration(): AstroIntegration {
  return {
    name: 'content-validation',
    hooks: {
      'astro:build:start': async () => {
        console.log('\n📋 Validating content files...');
        const report = validateAllContent('.');
        
        if (!report.success) {
          console.error('\n❌ Content validation failed:');
          for (const result of report.results) {
            if (!result.valid && result.errors) {
              console.error(`\n  File: ${result.file}`);
              for (const error of result.errors) {
                console.error(`    - ${error}`);
              }
            }
          }
          throw new Error('Content validation failed. Please fix the errors above.');
        }
        
        console.log(`✅ Content validation passed (${report.summary.valid} files validated)\n`);
      },
    },
  };
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const hasExternalScripts = false;
const whenExternalScripts = (items: (() => AstroIntegration) | (() => AstroIntegration)[] = []) =>
  hasExternalScripts ? (Array.isArray(items) ? items.map((item) => item()) : [items()]) : [];

export default defineConfig({
  // ============================================
  // GitHub Pages Configuration
  // Validates: Requirements 8.2, 8.3, 8.4
  // ============================================
  
  // OPTION 1: Custom Domain (Recommended)
  // Replace 'https://yourdomain.com' with your actual custom domain
  // Ensure CNAME file in public/ folder matches this domain
  // GitHub Pages will automatically enforce HTTPS
  site: 'https://dabozai.com',
  
  // OPTION 2: GitHub Pages without custom domain
  // Uncomment these lines and comment out the custom domain above:
  // site: 'https://yourusername.github.io',
  // base: '/your-repo-name',
  
  // ============================================
  // GitHub Pages Setup Instructions:
  // 1. Go to repository Settings > Pages
  // 2. Under "Build and deployment", select "GitHub Actions"
  // 3. For custom domain:
  //    a. Add your domain in "Custom domain" field
  //    b. Check "Enforce HTTPS"
  //    c. Update public/CNAME with your domain
  //    d. Configure DNS records with your domain provider
  // ============================================

  output: 'static',

  integrations: [
    // Content validation runs at build start
    contentValidationIntegration(),
    
    tailwind({
      applyBaseStyles: false,
    }),
    sitemap(),
    mdx(),
    icon({
      include: {
        tabler: ['*'],
        'flat-color-icons': [
          'template',
          'gallery',
          'approval',
          'document',
          'advertising',
          'currency-exchange',
          'voice-presentation',
          'business-contact',
          'database',
        ],
      },
    }),

    ...whenExternalScripts(() =>
      partytown({
        config: { forward: ['dataLayer.push'] },
      })
    ),

    compress({
      CSS: true,
      HTML: {
        'html-minifier-terser': {
          removeAttributeQuotes: false,
        },
      },
      Image: false,
      JavaScript: true,
      SVG: false,
      Logger: 1,
    }),

    astrowind({
      config: './src/config.yaml',
    }),
  ],

  image: {
    domains: ['cdn.pixabay.com'],
  },

  markdown: {
    remarkPlugins: [readingTimeRemarkPlugin],
    rehypePlugins: [responsiveTablesRehypePlugin, lazyImagesRehypePlugin],
  },

  vite: {
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
  },

  // Build configuration for optimal static site generation
  // Validates: Requirement 5.1
  build: {
    // Generate assets with hashed filenames for cache busting
    assets: 'assets',
    // Inline small assets to reduce HTTP requests
    inlineStylesheets: 'auto',
  },

  // Prefetch configuration for improved navigation performance
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'viewport',
  },
});
