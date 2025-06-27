import mongoose from 'mongoose';
import { logger } from '../utils/logger';

export class Database {
  private static instance: Database;
  private connection?: typeof mongoose;

  private constructor() {}

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async connect(uri: string): Promise<void> {
    try {
      this.connection = await mongoose.connect(uri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });

      logger.info('Connected to MongoDB successfully');

      mongoose.connection.on('error', (error) => {
        logger.error('MongoDB connection error:', error);
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

    } catch (error) {
      logger.error('Failed to connect to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.disconnect();
      logger.info('Disconnected from MongoDB');
    }
  }

  public isConnected(): boolean {
    return mongoose.connection.readyState === 1;
  }
}