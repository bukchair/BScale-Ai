/**
 * Structured logging for Cloud Run.
 * Outputs a single JSON line to stdout/stderr so Cloud Logging indexes
 * the fields (userEmail, userId, path, etc.) under jsonPayload,
 * making them searchable in the Cloud Run Logs viewer.
 *
 * Usage:
 *   import { logWithUserContext } from '@/src/lib/logging/server-structured-log';
 *   logWithUserContext('ERROR', 'Payment failed', { userEmail: user.email, path: '/api/...' });
 */

type LogLevel = 'DEBUG' | 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

interface LogContext {
  userEmail?: string | null;
  userId?: string | null;
  path?: string;
  [key: string]: unknown;
}

export function logWithUserContext(
  level: LogLevel,
  message: string,
  context: LogContext = {}
): void {
  const entry = {
    severity: level,
    message,
    ...context,
    time: new Date().toISOString(),
  };
  const line = JSON.stringify(entry);
  if (level === 'ERROR' || level === 'CRITICAL') {
    process.stderr.write(line + '\n');
  } else {
    process.stdout.write(line + '\n');
  }
}
