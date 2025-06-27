import PQueue from 'p-queue';
import { PuppeteerScraper } from '../scrapers/PuppeteerScraper';
import { ScrapedDataModel } from '../models/ScrapedData';
import { ScraperConfig, ScraperResult } from '../types';
import { logger } from '../utils/logger';
import { validateUrl } from '../utils/validation';

export class ScraperService {
  private scraper: PuppeteerScraper;
  private queue: PQueue;

  constructor(config: ScraperConfig) {
    this.scraper = new PuppeteerScraper(config);
    this.queue = new PQueue({
      concurrency: config.maxConcurrentRequests,
      interval: config.requestDelay,
      intervalCap: 1
    });
  }

  async initialize(): Promise<void> {
    await this.scraper.initialize();
    logger.info('Scraper service initialized');
  }

  async scrapeUrl(url: string): Promise<void  | ScraperResult> {
    const validation = validateUrl(url);
    if (validation.error) {
      throw new Error(`Invalid URL: ${validation.error}`);
    }

    return this.queue.add(async () => {
      logger.info(`Starting to scrape: ${url}`);
      
      const result = await this.scraper.scrape(url);
      
      if (result.data) {
        try {
          // Check if URL already exists
          const existing = await ScrapedDataModel.findOne({ url: result.data.url });
          
          if (existing) {
            // Update existing record
            Object.assign(existing, result.data);
            await existing.save();
            logger.info(`Updated existing record for: ${url}`);
          } else {
            // Create new record
            await ScrapedDataModel.create(result.data);
            logger.info(`Saved new record for: ${url}`);
          }
        } catch (dbError) {
          logger.error(`Failed to save data for ${url}:`, dbError);
          result.success = false;
          result.error = `Database error: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`;
        }
      }

      return result;
    });
  }

  async scrapeUrls(urls: string[]): Promise<(void | ScraperResult)[]> {
    logger.info(`Starting batch scrape of ${urls.length} URLs`);
    
    const results = await Promise.allSettled(
      urls.map(url => this.scrapeUrl(url))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        logger.error(`Failed to scrape ${urls[index]}:`, result.reason);
        return {
          success: false,
          error: result.reason instanceof Error ? result.reason.message : 'Unknown error'
        };
      }
    });
  }

  async getScrapedData(url?: string, limit: number = 100): Promise<any[]> {
    const query = url ? { url } : {};
    return ScrapedDataModel.find(query)
      .sort({ scrapedAt: -1 })
      .limit(limit)
      .lean();
  }

  async getStats(): Promise<any> {
    const [total, successful, failed, recent] = await Promise.all([
      ScrapedDataModel.countDocuments(),
      ScrapedDataModel.countDocuments({ status: 'success' }),
      ScrapedDataModel.countDocuments({ status: 'failed' }),
      ScrapedDataModel.countDocuments({
        scrapedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      })
    ]);

    return {
      total,
      successful,
      failed,
      recent,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) : 0
    };
  }

  async close(): Promise<void> {
    await this.scraper.close();
    logger.info('Scraper service closed');
  }
}