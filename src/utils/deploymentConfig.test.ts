/**
 * Unit tests for deployment configuration
 * Validates: Requirements 8.1, 8.3
 * 
 * Tests GitHub Actions workflow configuration and astro.config.ts settings
 */

import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

describe('GitHub Actions Workflow Configuration', () => {
  const workflowPath = path.join(process.cwd(), '.github/workflows/deploy.yml');
  
  it('should have deploy.yml workflow file', () => {
    expect(fs.existsSync(workflowPath)).toBe(true);
  });

  it('should trigger on main branch push', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = yaml.load(content) as Record<string, unknown>;
    
    expect(workflow.on).toBeDefined();
    const onConfig = workflow.on as Record<string, unknown>;
    expect(onConfig.push).toBeDefined();
    
    const pushConfig = onConfig.push as Record<string, unknown>;
    expect(pushConfig.branches).toContain('main');
  });

  it('should have correct permissions for GitHub Pages', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = yaml.load(content) as Record<string, unknown>;
    
    expect(workflow.permissions).toBeDefined();
    const permissions = workflow.permissions as Record<string, string>;
    expect(permissions.contents).toBe('read');
    expect(permissions.pages).toBe('write');
    expect(permissions['id-token']).toBe('write');
  });

  it('should have build and deploy jobs', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = yaml.load(content) as Record<string, unknown>;
    
    expect(workflow.jobs).toBeDefined();
    const jobs = workflow.jobs as Record<string, unknown>;
    expect(jobs.build).toBeDefined();
    expect(jobs.deploy).toBeDefined();
  });

  it('should run tests before building', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = yaml.load(content) as Record<string, unknown>;
    
    const jobs = workflow.jobs as Record<string, { steps: Array<{ run?: string; name?: string }> }>;
    const buildSteps = jobs.build.steps;
    
    // Find test step
    const testStep = buildSteps.find(step => 
      step.run?.includes('npm test') || step.name?.toLowerCase().includes('test')
    );
    expect(testStep).toBeDefined();
  });

  it('should use actions/deploy-pages for deployment', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = yaml.load(content) as Record<string, unknown>;
    
    const jobs = workflow.jobs as Record<string, { steps: Array<{ uses?: string }> }>;
    const deploySteps = jobs.deploy.steps;
    
    const deployAction = deploySteps.find(step => 
      step.uses?.includes('actions/deploy-pages')
    );
    expect(deployAction).toBeDefined();
  });

  it('should have concurrency configuration to prevent parallel deployments', () => {
    const content = fs.readFileSync(workflowPath, 'utf-8');
    const workflow = yaml.load(content) as Record<string, unknown>;
    
    expect(workflow.concurrency).toBeDefined();
    const concurrency = workflow.concurrency as Record<string, unknown>;
    expect(concurrency.group).toBe('pages');
  });
});

describe('Astro Configuration for GitHub Pages', () => {
  const configPath = path.join(process.cwd(), 'astro.config.ts');
  
  it('should have astro.config.ts file', () => {
    expect(fs.existsSync(configPath)).toBe(true);
  });

  it('should have site URL configured', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    // Check that site is defined (either custom domain or github.io)
    expect(content).toMatch(/site:\s*['"`]/);
  });

  it('should have static output mode', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toMatch(/output:\s*['"`]static['"`]/);
  });

  it('should have build configuration for assets', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toMatch(/build:\s*\{/);
    expect(content).toMatch(/assets:/);
  });

  it('should include GitHub Pages setup instructions in comments', () => {
    const content = fs.readFileSync(configPath, 'utf-8');
    expect(content).toMatch(/GitHub Pages/i);
    expect(content).toMatch(/custom domain/i);
  });
});

describe('CNAME Configuration', () => {
  const cnamePath = path.join(process.cwd(), 'public/CNAME');
  
  it('should have CNAME file in public directory', () => {
    expect(fs.existsSync(cnamePath)).toBe(true);
  });

  it('should contain a domain name', () => {
    const content = fs.readFileSync(cnamePath, 'utf-8');
    // Filter out comments and empty lines
    const lines = content.split('\n').filter(line => 
      line.trim() && !line.trim().startsWith('#')
    );
    expect(lines.length).toBeGreaterThan(0);
    // Domain should not contain spaces or special characters (basic validation)
    expect(lines[0]).toMatch(/^[a-zA-Z0-9][a-zA-Z0-9.-]*\.[a-zA-Z]{2,}$/);
  });
});
