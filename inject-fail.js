const { Queue } = require('bullmq');
const IORedis = require('ioredis');

async function run() {
  const connection = new IORedis('redis://localhost:6380');
  const queue = new Queue('document-processing', { connection });
  
  await queue.add('process-document', { documentId: 9999 }, {
    jobId: 'doc-9999',
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 }
  });
  console.log('Fake job submitted.');
  
  setTimeout(() => process.exit(0), 1000);
}

run();
