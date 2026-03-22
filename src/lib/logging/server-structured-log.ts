/**
 * Structured logging for Cloud Run.
 * Single-line JSON to stdout/stderr so entries appear in Cloud Run / Cloud Logging.
 * Searching by `userEmail` in the logs UI (textPayload) will match these lines.
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
    ts: new Date().toISOString(),
  };
  const line = JSON.stringify(entry);
  if (level === 'ERROR' || level === 'CRITICAL') console.error(line);
  else if (level === 'WARNING') console.warn(line);
  else console.log(line);
}
