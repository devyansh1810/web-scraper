import mongoose, { Schema, Document } from 'mongoose';
import { ScrapedData } from '../types';

export interface IScrapedDataDocument extends ScrapedData, Document { }

const ScrapedDataSchema = new Schema<IScrapedDataDocument>({
    url: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    title: {
        type: String,
        index: true
    },
    description: String,
    content: String,
    metadata: {
        type: Schema.Types.Mixed,
        default: {}
    },
    images: [{
        type: String
    }],
    links: [{
        type: String
    }],
    scrapedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    status: {
        type: String,
        enum: ['success', 'failed', 'partial'],
        default: 'success',
        index: true
    },
    error: String
}, {
    timestamps: true
});

ScrapedDataSchema.index({ url: 1, scrapedAt: -1 });
ScrapedDataSchema.index({ status: 1, scrapedAt: -1 });

export const ScrapedDataModel = mongoose.model<IScrapedDataDocument>('ScrapedData', ScrapedDataSchema);
