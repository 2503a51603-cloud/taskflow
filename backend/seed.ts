import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB, getDBStatus } from './config/db.ts';
import { seedTasksIfEmpty } from './storage/taskStore.ts';

async function runSeed() {
  const status = getDBStatus();
  if (status.configured) {
    const ok = await connectDB();
    if (!ok) {
      console.error('MONGODB_URI is configured but could not connect.');
      process.exit(1);
    }
  }

  try {
    const result = await seedTasksIfEmpty();
    if (result.inserted > 0) {
      console.log(
        `Inserted ${result.inserted} sample tasks into ${
          result.storageMode === 'mongodb'
            ? 'MongoDB'
            : 'backend/data/tasks.json'
        }.`
      );
    } else {
      console.log(
        `Existing ${result.existing} task(s) found. Skipping seed to preserve data.`
      );
    }
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

runSeed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
