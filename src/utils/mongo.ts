import mongoose from 'mongoose';

let isConnected = false;

export async function connectMongo(uri?: string) {
  if (isConnected) return;
  const mongoUri = uri || process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn('[Audit] MONGODB_URI not set. Audit logging will be disabled.');
    return;
  }
  try {
    await mongoose.connect(mongoUri as string, {
      autoIndex: true,
    } as any);
    isConnected = true;
    console.log('[Mongo] Connected to MongoDB for audit logs');
  } catch (err) {
    console.error('[Mongo] Failed to connect to MongoDB for audit logs', err);
  }
}

export default mongoose;


