import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export function createLogger(module: string) {
  return pino({
    level: process.env.LOG_LEVEL || 'info',
    transport: isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
  }).child({ module });
}
