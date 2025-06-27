import Joi from 'joi';

export const urlSchema = Joi.string().uri().required();

export const scraperConfigSchema = Joi.object({
  maxConcurrentRequests: Joi.number().min(1).max(20).default(5),
  requestDelay: Joi.number().min(0).default(1000),
  retryAttempts: Joi.number().min(0).max(10).default(3),
  timeout: Joi.number().min(1000).default(30000),
  userAgent: Joi.string().optional(),
  headless: Joi.boolean().default(true)
});

export const validateUrl = (url: string): { error?: string; value?: string } => {
  const { error, value } = urlSchema.validate(url);
  return error ? { error: error!.details[0]!.message } : { value };
};