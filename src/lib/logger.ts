import appRoot from 'app-root-path';
import { createLogger, format, transports } from 'winston';

const { combine, splat, timestamp, printf } = format;

const options = {
  file: {
    level: 'info',
    filename: `${appRoot}/logs/application.log`,
    handleException: true,
    json: true,
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    colorize: false
  },
  console: {
    level: 'debug',
    handleException: true,
    json: false,
    colorize: true
  }
};

const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message} `;
  if (metadata) {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

export const logger = createLogger({
  format: combine(format.colorize(), splat(), timestamp(), customFormat),
  transports: [
    new transports.File(options.file),
    new transports.Console(options.console)
  ],
  exitOnError: false
});

export const logStream = {
  write: function (message: string): void {
    logger.info(message);
  }
};
