import puppeteer, { Browser, Page } from 'puppeteer';
import UserAgent from 'user-agents';
import { BaseScraper } from './BaseScraper';
import { ScrapedData, ScraperResult } from '../types';
import { logger } from '../utils/logger';

export class PuppeteerScraper extends BaseScraper {
  private browser?: Browser;

  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: this.config.headless ?? true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding'
        ]
      });
      logger.info('Puppeteer browser initialized');
    } catch (error) {
      logger.error('Failed to initialize Puppeteer browser:', error);
      throw error;
    }
  }

  async scrape(url: string): Promise<ScraperResult> {
    if (!this.browser) {
      await this.initialize();
    }

    const normalizedUrl = this.normalizeUrl(url);
    let page: Page | undefined;

    try {
      const result = await this.retryOperation(async () => {
        page = await this.browser!.newPage();
        
        // Set user agent
        const userAgent = this.config.userAgent || new UserAgent().toString();
        await page.setUserAgent(userAgent);

        // Set viewport
        await page.setViewport({ width: 1920, height: 1080 });

        // Navigate to page
        await page.goto(normalizedUrl, {
          waitUntil: 'networkidle2',
          timeout: this.config.timeout
        });

        // Wait for content to load
        await page.waitForTimeout(2000);

        // Extract data
        const scrapedData = await page.evaluate(() => {
          const title = document.title || document.querySelector('h1')?.textContent || '';
          
          const description = 
            document.querySelector('meta[name="description"]')?.getAttribute('content') ||
            document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
            '';

          const content = document.body?.innerText || '';

          // Extract images
          const images = Array.from(document.querySelectorAll('img'))
            .map(img => img.src)
            .filter(src => src && !src.startsWith('data:'));

          // Extract links
          const links = Array.from(document.querySelectorAll('a[href]'))
            .map(link => (link as HTMLAnchorElement).href)
            .filter(href => href && href.startsWith('http'));

          // Extract metadata
          const metadata: Record<string, any> = {};
          document.querySelectorAll('meta').forEach(tag => {
            const name = tag.getAttribute('name') || tag.getAttribute('property');
            const content = tag.getAttribute('content');
            if (name && content) {
              metadata[name] = content;
            }
          });

          return {
            title: title.trim(),
            description: description.trim(),
            content: content.trim().substring(0, 10000), // Limit content size
            images: images.slice(0, 50), // Limit images
            links: [...new Set(links)].slice(0, 100), // Dedupe and limit links
            metadata
          };
        });

        const data: ScrapedData = {
          url: normalizedUrl,
          ...scrapedData,
          scrapedAt: new Date(),
          status: 'success'
        };

        return { success: true, data };
      });

      await this.delay(this.config.requestDelay);
      return result;

    } catch (error) {
      logger.error(`Failed to scrape ${normalizedUrl}:`, error);
      
      const errorData: ScrapedData = {
        url: normalizedUrl,
        scrapedAt: new Date(),
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      throw { success: false, data: errorData, error: errorData.error };
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      logger.info('Puppeteer browser closed');
    }
  }
}