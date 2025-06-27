import { ScraperConfig, ScraperResult } from '../types';
import { logger } from '../utils/logger';

export abstract class BaseScraper {
  protected config: ScraperConfig;

  constructor(config: ScraperConfig) {
    this.config = config;
  }

  abstract scrape(url: string): Promise<ScraperResult>;

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected async retryOperation<T>(
    operation: () => Promise<T>,
    attempts: number = this.config.retryAttempts
  ): Promise<T> {
    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        logger.warn(`Attempt ${i + 1} failed:`, error);
        if (i === attempts - 1) throw error;
        await this.delay(Math.pow(2, i) * 1000); // Exponential backoff
      }
    }
    throw new Error('All retry attempts failed');
  }

  protected normalizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.href;
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  protected extractMetadata(document: any): Record<string, any> {
    const metadata: Record<string, any> = {};
    
    // Extract meta tags
    const metaTags = document.querySelectorAll('meta');
    metaTags.forEach((tag: any) => {
      const name = tag.getAttribute('name') || tag.getAttribute('property');
      const content = tag.getAttribute('content');
      if (name && content) {
        metadata[name] = content;
      }
    });

    return metadata;
  }
}
