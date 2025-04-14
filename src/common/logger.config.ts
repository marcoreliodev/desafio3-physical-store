import * as winston from 'winston';
import { TransformableInfo } from 'logform';

export const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.errors({ stack: true }),
    winston.format.timestamp({ format: 'DD-MM-YYYY HH:mm:ss' }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      dirname: './logs',
    }),
    new winston.transports.File({
      filename: 'info.log',
      level: 'info',
      dirname: './logs',
    }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.simple(),
        winston.format.colorize(),
        winston.format.splat(),
        winston.format.printf((info: TransformableInfo) => {
          if (info.stack) {
            return `${info.timestamp} ${info.level} ${info.stack}`;
          }
          return `${info.timestamp} ${info.level} ${String(info.message).trim()}`;
        }),
      ),
    }),
  );
}
