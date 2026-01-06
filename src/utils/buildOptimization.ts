/**
 * Build optimization utilities for static site generation
 * Validates: Requirement 5.1 - Static asset optimization
 */
import fs from 'fs';
import path from 'path';

export interface AssetInfo {
  path: string;
  size: number;
  type: 'html' | 'css' | 'js' | 'image' | 'other';
  hasHash: boolean;
}

export interface BuildReport {
  timestamp: string;
  outputDir: string;
  assets: AssetInfo[];
  summary: {
    totalFiles: number;
    totalSize: number;
    htmlFiles: number;
    cssFiles: number;
    jsFiles: number;
    imageFiles: number;
    otherFiles: number;
    hashedAssets: number;
    averageHtmlSize: number;
    averageCssSize: number;
    averageJsSize: number;
  };
  optimizationChecks: {
    allAssetsHashed: boolean;
    htmlMinified: boolean;
    cssMinified: boolean;
    jsMinified: boolean;
  };
}

/**
 * Determines the asset type based on file extension
 */
export function getAssetType(filePath: string): AssetInfo['type'] {
  const ext = path.extname(filePath).toLowerCase();
  
  if (ext === '.html' || ext === '.htm') return 'html';
  if (ext === '.css') return 'css';
  if (ext === '.js' || ext === '.mjs') return 'js';
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif', '.ico'].includes(ext)) return 'image';
  
  return 'other';
}

/**
 * Checks if a filename contains a content hash (typically 8+ hex characters)
 */
export function hasContentHash(filename: string): boolean {
  // Match patterns like: file.abc123de.js or file-abc123de.css
  const hashPattern = /[._-][a-f0-9]{8,}\./i;
  return hashPattern.test(filename);
}

/**
 * Checks if HTML content appears to be minified
 */
export function isHtmlMinified(content: string): boolean {
  // Minified HTML typically has very few newlines relative to content length
  const newlineCount = (content.match(/\n/g) || []).length;
  const contentLength = content.length;
  
  // If content is small (less than 200 chars), consider it minified
  if (contentLength < 200) return true;
  
  // Minified HTML should have less than 1 newline per 50 characters on average
  // This is a stricter threshold to properly detect non-minified HTML
  return newlineCount / contentLength < 0.02;
}

/**
 * Checks if CSS content appears to be minified
 */
export function isCssMinified(content: string): boolean {
  // Minified CSS typically has no unnecessary whitespace
  const whitespaceRatio = (content.match(/\s{2,}/g) || []).length / content.length;
  return whitespaceRatio < 0.001;
}

/**
 * Checks if JS content appears to be minified
 */
export function isJsMinified(content: string): boolean {
  // Minified JS typically has very few newlines and comments
  const newlineCount = (content.match(/\n/g) || []).length;
  const commentCount = (content.match(/\/\*|\*\/|\/\//g) || []).length;
  const contentLength = content.length;
  
  if (contentLength < 100) return true;
  
  return (newlineCount + commentCount) / contentLength < 0.005;
}

/**
 * Recursively collects all files in a directory
 */
export function collectFiles(dir: string, baseDir: string = dir): AssetInfo[] {
  const assets: AssetInfo[] = [];
  
  if (!fs.existsSync(dir)) {
    return assets;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    if (entry.isDirectory()) {
      assets.push(...collectFiles(fullPath, baseDir));
    } else if (entry.isFile()) {
      const stats = fs.statSync(fullPath);
      assets.push({
        path: relativePath,
        size: stats.size,
        type: getAssetType(entry.name),
        hasHash: hasContentHash(entry.name),
      });
    }
  }
  
  return assets;
}

/**
 * Generates a comprehensive build report for the output directory
 */
export function generateBuildReport(outputDir: string): BuildReport {
  const assets = collectFiles(outputDir);
  
  const htmlFiles = assets.filter(a => a.type === 'html');
  const cssFiles = assets.filter(a => a.type === 'css');
  const jsFiles = assets.filter(a => a.type === 'js');
  const imageFiles = assets.filter(a => a.type === 'image');
  const otherFiles = assets.filter(a => a.type === 'other');
  
  // Check optimization status by sampling files
  let htmlMinified = true;
  let cssMinified = true;
  let jsMinified = true;
  
  // Sample up to 3 files of each type for minification check
  for (const asset of htmlFiles.slice(0, 3)) {
    const content = fs.readFileSync(path.join(outputDir, asset.path), 'utf-8');
    if (!isHtmlMinified(content)) {
      htmlMinified = false;
      break;
    }
  }
  
  for (const asset of cssFiles.slice(0, 3)) {
    const content = fs.readFileSync(path.join(outputDir, asset.path), 'utf-8');
    if (!isCssMinified(content)) {
      cssMinified = false;
      break;
    }
  }
  
  for (const asset of jsFiles.slice(0, 3)) {
    const content = fs.readFileSync(path.join(outputDir, asset.path), 'utf-8');
    if (!isJsMinified(content)) {
      jsMinified = false;
      break;
    }
  }
  
  // Check if assets in the assets folder have hashes
  const assetsInAssetsFolder = assets.filter(a => 
    a.path.startsWith('assets/') && (a.type === 'css' || a.type === 'js')
  );
  const allAssetsHashed = assetsInAssetsFolder.length === 0 || 
    assetsInAssetsFolder.every(a => a.hasHash);
  
  const totalSize = assets.reduce((sum, a) => sum + a.size, 0);
  const avgHtmlSize = htmlFiles.length > 0 
    ? htmlFiles.reduce((sum, a) => sum + a.size, 0) / htmlFiles.length 
    : 0;
  const avgCssSize = cssFiles.length > 0 
    ? cssFiles.reduce((sum, a) => sum + a.size, 0) / cssFiles.length 
    : 0;
  const avgJsSize = jsFiles.length > 0 
    ? jsFiles.reduce((sum, a) => sum + a.size, 0) / jsFiles.length 
    : 0;
  
  return {
    timestamp: new Date().toISOString(),
    outputDir,
    assets,
    summary: {
      totalFiles: assets.length,
      totalSize,
      htmlFiles: htmlFiles.length,
      cssFiles: cssFiles.length,
      jsFiles: jsFiles.length,
      imageFiles: imageFiles.length,
      otherFiles: otherFiles.length,
      hashedAssets: assets.filter(a => a.hasHash).length,
      averageHtmlSize: Math.round(avgHtmlSize),
      averageCssSize: Math.round(avgCssSize),
      averageJsSize: Math.round(avgJsSize),
    },
    optimizationChecks: {
      allAssetsHashed,
      htmlMinified,
      cssMinified,
      jsMinified,
    },
  };
}

/**
 * Validates that the build output meets optimization requirements
 */
export function validateBuildOptimization(outputDir: string): {
  valid: boolean;
  report: BuildReport;
  errors: string[];
} {
  const report = generateBuildReport(outputDir);
  const errors: string[] = [];
  
  // Check that CSS and JS assets have content hashes for cache busting
  if (!report.optimizationChecks.allAssetsHashed) {
    errors.push('Not all CSS/JS assets in the assets folder have content hashes');
  }
  
  // Check HTML minification
  if (!report.optimizationChecks.htmlMinified) {
    errors.push('HTML files do not appear to be minified');
  }
  
  // Check CSS minification
  if (!report.optimizationChecks.cssMinified) {
    errors.push('CSS files do not appear to be minified');
  }
  
  // Check JS minification
  if (!report.optimizationChecks.jsMinified) {
    errors.push('JavaScript files do not appear to be minified');
  }
  
  return {
    valid: errors.length === 0,
    report,
    errors,
  };
}
