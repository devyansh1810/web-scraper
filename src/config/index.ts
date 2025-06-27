import dotenv from 'dotenv';
import { ScraperConfig } from '../types';
import { scraperConfigSchema } from '../utils/validation';

dotenv.config();

export const config = {
  mongodb: {
    uri: 'mongodb+srv://localhost:27017/webscraper',
  },
  scraper: scraperConfigSchema.validate({
    maxConcurrentRequests: parseInt('5'),
    requestDelay: parseInt('1000'),
    retryAttempts: parseInt('3'),
    timeout: parseInt('30000'),
    headless: 'production'
  }).value as ScraperConfig
};

// 1p3tuZjhU755tYTp
// divyanshu