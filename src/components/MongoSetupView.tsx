import { CheckCircle2, Database, RefreshCw, XCircle } from 'lucide-react';
import type { HealthResponse } from '../types/task';

interface MongoSetupViewProps {
  health: HealthResponse | null;
  checking: boolean;
  onRetryConnection: () => void;
  onLoadSamples?: () => void;
  onSyncJsonTasks?: () => void;
}

export function MongoSetupView({
  health,
  checking,
  onRetryConnection,
  onLoadSamples,
  onSyncJsonTasks,
}: MongoSetupViewProps) {
  const connected = Boolean(health?.database.connected);
  const configured = Boolean(health?.database.configured);
  const placeholderDetected = Boolean(health?.database.placeholderDetected);
  const isJsonMode = !configured && !connected;
  const jsonTaskCount = health?.jsonTaskCount ?? 0;

  return (
    <div className="space-y-6 max-w-4xl">
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
                connected
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : placeholderDetected
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                  : isJsonMode
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
              }`}
            >
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {connected
                  ? 'MongoDB Atlas Connected'
                  : placeholderDetected
                  ? 'Replace Placeholder Password in MONGODB_URI'
                  : isJsonMode
                  ? 'JSON File Storage Active (Ready for MongoDB Atlas)'
                  : 'MongoDB Atlas Connection Issue'}
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                {connected
                  ? `Connected to database "${health?.database.dbName || 'default'}" via Mongoose.`
                  : placeholderDetected
                  ? health?.database.error ||
                    'MONGODB_URI still contains a placeholder password (YOUR_PASSWORD). Replace it with your actual Atlas password in Settings → Secrets.'
                  : isJsonMode
                  ? 'All tasks are currently persisted on the Express backend in backend/data/tasks.json. Add MONGODB_URI anytime to switch to MongoDB Atlas.'
                  : health?.database.error ||
                    'Unable to reach MongoDB Atlas with the configured MONGODB_URI.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {connected && jsonTaskCount > 0 && onSyncJsonTasks && (
              <button
                type="button"
                onClick={onSyncJsonTasks}
                className="px-4 py-2 min-h-[40px] rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 text-sm font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors whitespace-nowrap"
              >
                Import {jsonTaskCount} JSON Task(s)
              </button>
            )}
            {onLoadSamples && (
              <button
                type="button"
                onClick={onLoadSamples}
                className="px-4 py-2 min-h-[40px] rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
              >
                Load Sample Tasks
              </button>
            )}
            <button
              type="button"
              onClick={onRetryConnection}
              disabled={checking}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[40px] rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-sm font-medium text-white transition-colors whitespace-nowrap"
            >
              <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Checking...' : 'Test Connection'}</span>
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <span className="text-slate-500 dark:text-slate-400">
              Active Storage Backend
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>{connected ? 'MongoDB Atlas' : 'Server JSON File'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400">
              MONGODB_URI Env Var
            </span>
            <div className="mt-1 flex items-center gap-1.5 font-medium text-slate-900 dark:text-slate-100">
              {configured ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <XCircle className="h-4 w-4 text-slate-400" />
              )}
              <span>{configured ? 'Configured' : 'Not set yet (JSON mode)'}</span>
            </div>
          </div>

          <div>
            <span className="text-slate-500 dark:text-slate-400">
              State / File
            </span>
            <div className="mt-1 font-mono font-medium text-slate-900 dark:text-slate-100 truncate">
              {health?.database.state ?? 'Unknown'}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
          How to Connect MongoDB Atlas
        </h2>

        <ol className="space-y-3 text-sm text-slate-700 dark:text-slate-300 list-decimal pl-5">
          <li>
            Sign in or create a free account at{' '}
            <span className="font-medium text-slate-900 dark:text-slate-100">
              cloud.mongodb.com
            </span>
            .
          </li>
          <li>
            Click <span className="font-medium">Build a Database</span> and select
            the free <span className="font-medium">M0 Sandbox</span> shared
            cluster.
          </li>
          <li>
            Under <span className="font-medium">Database Access</span>, create a
            database user with a username and password and grant{' '}
            <span className="font-medium">Read and write to any database</span>.
          </li>
          <li>
            Under <span className="font-medium">Network Access</span>, add your
            current IP address (or <span className="font-mono">0.0.0.0/0</span>{' '}
            for college demo / cloud hosting).
          </li>
          <li>
            Click <span className="font-medium">Connect &rarr; Drivers</span> and
            copy your SRV connection string (for example:{' '}
            <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              mongodb+srv://user:password@cluster0.xxxxx.mongodb.net/taskplanner?retryWrites=true&amp;w=majority
            </code>
            ).
          </li>
          <li>
            Add{' '}
            <code className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              MONGODB_URI
            </code>{' '}
            to your <code className="font-mono text-xs">.env</code> file (or
            Environment Secrets panel) and click{' '}
            <span className="font-medium">Test Connection</span> above.
          </li>
        </ol>
      </section>
    </div>
  );
}
