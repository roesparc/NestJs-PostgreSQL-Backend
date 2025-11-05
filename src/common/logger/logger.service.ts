import { Injectable, LoggerService } from '@nestjs/common';
import { createLogger, format, transports } from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class AppLogger implements LoggerService {
  private logger = createLogger({
    level: 'info',
    format: format.combine(format.timestamp(), format.json()),
    transports: [
      new transports.Console(),

      new DailyRotateFile({
        filename: 'logs/error-%DATE%.log',
        datePattern: 'YYYY-MM', // Monthly rotation
        level: 'error',
        maxSize: '20m',
        maxFiles: '12', // Keep 12 months of logs
        zippedArchive: true, // Compress old files
      }),

      new DailyRotateFile({
        filename: 'logs/combined-%DATE%.log',
        datePattern: 'YYYY-MM', // Monthly rotation
        maxSize: '20m',
        maxFiles: '12', // Keep 12 months of logs
        zippedArchive: true, // Compress old files
      }),
    ],
  });

  log(meta?: any) {
    this.logger.info(meta);
  }

  error(meta?: any) {
    this.logger.error(meta);
  }

  warn(meta?: any) {
    this.logger.warn(meta);
  }
}
