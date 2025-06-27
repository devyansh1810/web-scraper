export interface ScrapedData {
  url: string;
  title?: string;
  description?: string;
  content?: string;
  metadata?: Record<string, any>;
  images?: string[];
  links?: string[];
  scrapedAt: Date;
  status: 'success' | 'failed' | 'partial';
  error?: string;
}

export interface ScraperConfig {
  maxConcurrentRequests: number;
  requestDelay: number;
  retryAttempts: number;
  timeout: number;
  userAgent?: string;
  headless?: boolean;
}

export interface ScraperResult {
  success: boolean;
  data?: ScrapedData;
  error?: string;
}