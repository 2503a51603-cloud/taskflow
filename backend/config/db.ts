import mongoose from 'mongoose';

export interface DBStatus {
  connected: boolean;
  configured: boolean;
  placeholderDetected: boolean;
  readyState: number;
  stateLabel: string;
  host: string | null;
  dbName: string | null;
  lastError: string | null;
}

const READY_STATE_LABELS: Record<number, string> = {
  0: 'Disconnected',
  1: 'Connected',
  2: 'Connecting',
  3: 'Disconnecting',
};

const PLACEHOLDER_PASSWORDS = new Set([
  'your_password',
  'yourpasswordhere',
  '<password>',
  '<db_password>',
  'password',
  '<actual_password>',
  'actual_password',
]);

let lastConnectionError: string | null = null;
let connectionPromise: Promise<boolean> | null = null;

function sanitizeMongoUri(raw: string | undefined): {
  uri: string;
  placeholderDetected: boolean;
} {
  if (!raw) return { uri: '', placeholderDetected: false };
  let cleaned = raw.trim();

  // Strip accidental "MONGODB_URI=" prefix if pasted into a secret field
  cleaned = cleaned.replace(/^MONGODB_URI\s*=\s*/i, '').trim();

  // Strip accidental surrounding quotes
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }

  if (
    !cleaned ||
    cleaned === 'your_mongodb_atlas_connection_string' ||
    cleaned === 'MY_MONGODB_URI'
  ) {
    return { uri: '', placeholderDetected: false };
  }

  // Safely parse user:password@host and auto-encode special password characters if unencoded
  const match = /^(mongodb(?:\+srv)?:\/\/)([^:/?#]+):(.+)@([^/?#]+)(.*)$/.exec(
    cleaned
  );
  if (match) {
    const [, scheme, user, rawPass, host, rest] = match;
    if (PLACEHOLDER_PASSWORDS.has(rawPass.trim().toLowerCase())) {
      return { uri: cleaned, placeholderDetected: true };
    }

    let safePass = rawPass;
    try {
      const decoded = decodeURIComponent(rawPass);
      // Re-encode if rawPass contained unencoded reserved URI characters
      if (decoded === rawPass && /[@#:/?&=+$!, ]/.test(rawPass)) {
        safePass = encodeURIComponent(rawPass);
      }
    } catch {
      safePass = encodeURIComponent(rawPass);
    }

    const safeUser = encodeURIComponent(
      (() => {
        try {
          return decodeURIComponent(user);
        } catch {
          return user;
        }
      })()
    );

    return {
      uri: `${scheme}${safeUser}:${safePass}@${host}${rest}`,
      placeholderDetected: false,
    };
  }

  return { uri: cleaned, placeholderDetected: false };
}

function formatMongoError(err: unknown): string {
  const rawMessage =
    err instanceof Error ? err.message : 'Unable to connect to MongoDB.';

  if (rawMessage.includes('Invalid scheme')) {
    return 'MONGODB_URI must start with "mongodb://" or "mongodb+srv://". Paste the full Drivers connection string from MongoDB Atlas.';
  }
  if (
    rawMessage.includes('Authentication failed') ||
    rawMessage.includes('bad auth')
  ) {
    return 'MongoDB authentication failed. Verify the password for your Atlas database user in Settings → Secrets (MONGODB_URI).';
  }
  if (
    rawMessage.includes('Server selection timed out') ||
    rawMessage.includes('ENOTFOUND') ||
    rawMessage.includes('ECONNREFUSED')
  ) {
    return 'Could not reach MongoDB Atlas cluster. Check Network Access (allow 0.0.0.0/0 for cloud preview) and cluster hostname.';
  }
  return rawMessage;
}

export async function connectDB(uriOverride?: string): Promise<boolean> {
  const { uri, placeholderDetected } = sanitizeMongoUri(
    uriOverride ?? process.env.MONGODB_URI
  );

  if (!uri) {
    lastConnectionError =
      'MONGODB_URI is not configured. Using server-side JSON storage until MongoDB Atlas is connected.';
    return false;
  }

  if (placeholderDetected) {
    lastConnectionError =
      'MONGODB_URI still contains a placeholder password (such as YOUR_PASSWORD). Update Settings → Secrets with your real Atlas password.';
    return false;
  }

  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    lastConnectionError =
      'MONGODB_URI must start with "mongodb://" or "mongodb+srv://". Paste the full Drivers connection string from MongoDB Atlas.';
    return false;
  }

  if (mongoose.connection.readyState === 1) {
    lastConnectionError = null;
    return true;
  }

  if (connectionPromise) {
    return connectionPromise;
  }

  connectionPromise = (async () => {
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        socketTimeoutMS: 20000,
      });
      lastConnectionError = null;
      console.log(
        `[MongoDB] Connected to database "${mongoose.connection.name}" on ${mongoose.connection.host}`
      );
      return true;
    } catch (err) {
      const friendly = formatMongoError(err);
      lastConnectionError = friendly;
      return false;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

export function getDBStatus(): DBStatus {
  const { uri, placeholderDetected } = sanitizeMongoUri(
    process.env.MONGODB_URI
  );
  const configured = Boolean(uri) && !placeholderDetected;
  const readyState = mongoose.connection.readyState;
  const connected = readyState === 1;

  return {
    connected,
    configured,
    placeholderDetected,
    readyState,
    stateLabel: READY_STATE_LABELS[readyState] ?? 'Unknown',
    host: connected ? mongoose.connection.host : null,
    dbName: connected ? mongoose.connection.name : null,
    lastError: connected ? null : lastConnectionError,
  };
}
