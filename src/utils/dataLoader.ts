import yaml from 'js-yaml';
import fs from 'fs';
import path from 'path';
import type { ZodSchema } from 'zod';
import {
  resumeFileSchema,
  repositoriesFileSchema,
  publicationsFileSchema,
  testimonialsFileSchema,
  type ResumeData,
} from './schemas';

export interface DataLoadResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Load and parse a YAML file with schema validation
 */
export function loadYamlFile<T>(filePath: string, schema: ZodSchema<T>): DataLoadResult<T> {
  try {
    const absolutePath = path.resolve(filePath);
    
    if (!fs.existsSync(absolutePath)) {
      return {
        success: false,
        error: `File not found: ${filePath}`,
      };
    }

    const fileContent = fs.readFileSync(absolutePath, 'utf-8');
    const parsedYaml = yaml.load(fileContent);
    
    const validationResult = schema.safeParse(parsedYaml);
    
    if (!validationResult.success) {
      return {
        success: false,
        error: `Schema validation failed: ${validationResult.error.message}`,
      };
    }

    return {
      success: true,
      data: validationResult.data,
    };
  } catch (error) {
    return {
      success: false,
      error: `Failed to load file: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}

/**
 * Load resume data from YAML file
 */
export function loadResumeData(filePath: string = 'src/data/resume.yaml'): DataLoadResult<ResumeData> {
  return loadYamlFile(filePath, resumeFileSchema);
}

/**
 * Load repositories data from YAML file
 */
export function loadRepositoriesData(filePath: string = 'src/data/repositories.yaml') {
  return loadYamlFile(filePath, repositoriesFileSchema);
}

/**
 * Load publications data from YAML file
 */
export function loadPublicationsData(filePath: string = 'src/data/publications.yaml') {
  return loadYamlFile(filePath, publicationsFileSchema);
}

/**
 * Load testimonials data from YAML file
 */
export function loadTestimonialsData(filePath: string = 'src/data/testimonials.yaml') {
  return loadYamlFile(filePath, testimonialsFileSchema);
}

/**
 * Calculate average rating for a specific course from testimonials
 */
export function calculateAverageRating(testimonials: Array<{ courseSlug: string; rating: number }>, courseSlug: string): number | null {
  const courseTestimonials = testimonials.filter(t => t.courseSlug === courseSlug);
  
  if (courseTestimonials.length === 0) {
    return null;
  }

  const sum = courseTestimonials.reduce((acc, t) => acc + t.rating, 0);
  return Math.round((sum / courseTestimonials.length) * 10) / 10;
}

/**
 * Get testimonials for a specific course
 */
export function getTestimonialsForCourse<T extends { courseSlug: string }>(testimonials: T[], courseSlug: string): T[] {
  return testimonials.filter(t => t.courseSlug === courseSlug);
}
