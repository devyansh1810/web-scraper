import { Database } from './config/database';
import { ScraperService } from './services/ScraperService';
import { config } from './config';
import { logger } from './utils/logger';

class WebScraperApp {
  private database: Database;
  private scraperService: ScraperService;

  constructor() {
    this.database = Database.getInstance();
    this.scraperService = new ScraperService(config.scraper);
  }

  async initialize(): Promise<void> {
    try {
      // Connect to database
      await this.database.connect(config.mongodb.uri);
      
      // Initialize scraper service
      await this.scraperService.initialize();

      logger.info('Web scraper application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      throw error;
    }
  }

  async scrapeUrl(url: string) {
    return this.scraperService.scrapeUrl(url);
  }

  async scrapeUrls(urls: string[]) {
    return this.scraperService.scrapeUrls(urls);
  }

  async getScrapedData(url?: string, limit?: number) {
    return this.scraperService.getScrapedData(url, limit);
  }

  async getStats() {
    return this.scraperService.getStats();
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down application...');
    
    await this.scraperService.close();
    await this.database.disconnect();
    
    logger.info('Application shutdown complete');
    process.exit(0);
  }
}

// Example usage
async function main() {
  const app = new WebScraperApp();

  // Handle graceful shutdown
  process.on('SIGINT', () => app.shutdown());
  process.on('SIGTERM', () => app.shutdown());

  try {
    await app.initialize();

    // Example: Scrape a single URL
    const result = await app.scrapeUrl('https://www.amazon.in/s?k=printer+amazon&adgrpid=69892872237&ext_vrnc=hi&hvadid=714825034799&hvdev=c&hvlocphy=9062141&hvnetw=g&hvqmt=e&hvrand=10336266930407979047&hvtargid=kwd-8534355983&hydadcr=1444_2348185&mcid=9a83418bc7a63c66b20630ef8b91ab68&tag=googinhydr1-21&ref=pd_sl_2u4dnq6u1v_e');
    console.log('Scrape result:', result);

    // Example: Scrape multiple URLs
    // const urls = [
    //   'https://example.com',
    //   'https://httpbin.org/html',
    //   'https://jsonplaceholder.typicode.com'
    // ];
    
    // const results = await app.scrapeUrls(urls);
    // console.log('Batch scrape results:', results);

    // Get statistics
    const stats = await app.getStats();
    console.log('Scraper statistics:', stats);

    // Get scraped data
    const data = await app.getScrapedData(undefined, 10);
    console.log('Recent scraped data:', data);

    await app.shutdown();
  } catch (error) {
    logger.error('Application error:', error);
    await app.shutdown();
  }
}

// Run the application
if (require.main === module) {
  main().catch(console.error);
}

export { WebScraperApp };