import { z } from 'zod';

/**
 * Schema for training products content collection
 * Validates: Requirements 2.5
 */
export const productSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  duration: z.string().min(1, 'Duration is required'),
  price: z.number().positive().optional(),
  image: z.string().min(1, 'Image path is required'),
  featured: z.boolean().default(false),
  category: z.string().min(1, 'Category is required'),
  prerequisites: z.array(z.string()).optional(),
  learningOutcomes: z.array(z.string()).min(1, 'At least one learning outcome is required'),
});

/**
 * Schema for testimonials data
 * Validates: Requirements 10.2
 */
export const testimonialSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  authorName: z.string().min(1, 'Author name is required'),
  courseSlug: z.string().min(1, 'Course slug is required'),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  text: z.string().min(1, 'Testimonial text is required'),
  date: z.string().min(1, 'Date is required'),
  verified: z.boolean().default(false),
});

export const testimonialsFileSchema = z.object({
  testimonials: z.array(testimonialSchema),
});

/**
 * Schema for repository data
 * Validates: Requirements 9.2
 */
export const repositorySchema = z.object({
  name: z.string().min(1, 'Repository name is required'),
  description: z.string().min(1, 'Description is required'),
  url: z.string().url('Must be a valid URL'),
  technologies: z.array(z.string()),
  featured: z.boolean().default(false),
  stars: z.number().nonnegative().optional(),
});

export const repositoriesFileSchema = z.object({
  repositories: z.array(repositorySchema),
});

/**
 * Schema for publication data
 * Validates: Requirements 9.2
 */
export const publicationSchema = z.object({
  title: z.string().min(1, 'Publication title is required'),
  authors: z.array(z.string()).min(1, 'At least one author is required'),
  venue: z.string().min(1, 'Venue is required'),
  year: z.number().int().min(1900).max(2100),
  url: z.string().url().optional(),
  downloadUrl: z.string().url().optional(),
  abstract: z.string().optional(),
});

export const publicationsFileSchema = z.object({
  publications: z.array(publicationSchema),
});

/**
 * Schema for resume/portfolio data
 * Validates: Requirements 1.2
 */
export const personalInfoSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().min(1, 'Title is required'),
  email: z.string().email('Must be a valid email'),
  phone: z.string().optional(),
  location: z.string().optional(),
  summary: z.string().optional(),
});

export const experienceSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  position: z.string().min(1, 'Position is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().optional(),
  description: z.string().optional(),
  achievements: z.array(z.string()).optional(),
});

export const certificationSchema = z.object({
  name: z.string().min(1, 'Certification name is required'),
  issuer: z.string().min(1, 'Issuer is required'),
  date: z.string().min(1, 'Date is required'),
  credentialId: z.string().optional(),
  credentialUrl: z.string().url().optional(),
});

export const skillCategorySchema = z.object({
  category: z.string().min(1, 'Category is required'),
  items: z.array(z.string()).min(1, 'At least one skill item is required'),
});

export const resumeFileSchema = z.object({
  personalInfo: personalInfoSchema,
  experience: z.array(experienceSchema).optional(),
  certifications: z.array(certificationSchema).optional(),
  skills: z.array(skillCategorySchema).optional(),
});

export type Product = z.infer<typeof productSchema>;
export type Testimonial = z.infer<typeof testimonialSchema>;
export type Repository = z.infer<typeof repositorySchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type PersonalInfo = z.infer<typeof personalInfoSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type ResumeData = z.infer<typeof resumeFileSchema>;
