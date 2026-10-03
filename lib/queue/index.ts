import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6380';
const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const documentQueue = new Queue('document-processing', { connection });
