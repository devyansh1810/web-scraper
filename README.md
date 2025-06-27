# Web Scraper with MongoDB

A production-level TypeScript web scraper that extracts data from URLs and stores it in MongoDB.

## Features

- **Robust scraping** with Puppeteer for dynamic content
- **MongoDB storage** with Mongoose ODM
- **Rate limiting** and concurrent request management
- **Retry mechanisms** with exponential backoff
- **Comprehensive logging** with Winston
- **Data validation** with Joi
- **TypeScript** for type safety
- **Production-ready** architecture

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start MongoDB locally:
```bash
mongod
```

4. Build and run:
```bash
npm run build
npm start
```

## Usage

```typescript
import { WebScraperApp } from './src';

const app = new WebScraperApp();
await app.initialize();

// Scrape a single URL
const result = await app.scrapeUrl('https://example.com');

// Scrape multiple URLs
const results = await app.scrapeUrls([
  'https://example.com',
  'https://another-site.com'
]);

// Get statistics
const stats = await app.getStats();

// Get scraped data
const data = await app.getScrapedData();
```

## Configuration

Configure via environment variables:

- `MONGODB_URI`: MongoDB connection string
- `MAX_CONCURRENT_REQUESTS`: Maximum concurrent scraping requests
- `REQUEST_DELAY_MS`: Delay between requests
- `RETRY_ATTEMPTS`: Number of retry attempts for failed requests
- `TIMEOUT_MS`: Request timeout in milliseconds
- `LOG_LEVEL`: Logging level (debug, info, warn, error)

## Architecture

- **BaseScraper**: Abstract base class for scrapers
- **PuppeteerScraper**: Puppeteer-based scraper implementation
- **ScraperService**: High-level service managing scraping operations
- **Database**: MongoDB connection manager
- **Models**: Mongoose schemas for data storage
- **Validation**: Input validation and sanitization
- **Logging**: Structured logging with Winston