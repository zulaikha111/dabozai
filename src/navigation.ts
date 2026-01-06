import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

/**
 * Navigation Configuration for Zuzu's Portfolio
 * 
 * Global navigation structure for the portfolio training website.
 * Includes: Home, Portfolio, About/CV, Blog, Training, Contact
 */

export const headerData = {
  links: [
    {
      text: 'Home',
      href: getPermalink('/'),
    },
    {
      text: 'Portfolio',
      href: getPermalink('/portfolio'),
    },
    {
      text: 'About/CV',
      href: getPermalink('/about'),
    },
    {
      text: 'Blog',
      href: getBlogPermalink(),
    },
    {
      text: 'Training',
      href: getPermalink('/services'),
    },
    {
      text: 'Contact',
      href: getPermalink('/contact'),
    },
  ],
  actions: [{ text: 'Get in Touch', href: getPermalink('/contact') }],
};

export const footerData = {
  links: [
    {
      title: 'Navigation',
      links: [
        { text: 'Home', href: getPermalink('/') },
        { text: 'Portfolio', href: getPermalink('/portfolio') },
        { text: 'About/CV', href: getPermalink('/about') },
        { text: 'Blog', href: getBlogPermalink() },
        { text: 'Training', href: getPermalink('/services') },
        { text: 'Contact', href: getPermalink('/contact') },
      ],
    },
    {
      title: 'Expertise',
      links: [
        { text: 'LLM Development', href: getPermalink('/services') },
        { text: 'AI Agents', href: getPermalink('/services') },
        { text: 'Robotics', href: getPermalink('/services') },
        { text: 'MLOps', href: getPermalink('/services') },
      ],
    },
    {
      title: 'Legal',
      links: [
        { text: 'Terms', href: getPermalink('/terms') },
        { text: 'Privacy Policy', href: getPermalink('/privacy') },
      ],
    },
  ],
  secondaryLinks: [
    { text: 'Terms', href: getPermalink('/terms') },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'GitHub', icon: 'tabler:brand-github', href: 'https://github.com/zuzu-ai' },
    { ariaLabel: 'LinkedIn', icon: 'tabler:brand-linkedin', href: 'https://linkedin.com/in/zuzu-ai' },
    { ariaLabel: 'X', icon: 'tabler:brand-x', href: 'https://twitter.com/zuzu_ai' },
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
  ],
  footNote: `
    © 2024 Zuzu | AI/ML Engineer & Robotics Specialist · Melbourne, Australia
  `,
};
