import chalk from "chalk";
import { createLogger, transports, format } from "winston";
import * as fs from "fs";
import * as path from "path";

const logsDirectory = path.join(__dirname, "..", "logs");
fs.existsSync(logsDirectory) || fs.mkdirSync(logsDirectory);

const errorLogFileName = path.join(
  logsDirectory,
  `${new Date().toISOString().split("T")[0]}.log`
);

const logger = createLogger({
  transports: [
    new transports.Console(),
    new transports.File({ filename: errorLogFileName, level: "error" }),
  ],
  format: createLogFormat(),
});

function createLogFormat() {
  return format.json();
}

class Logger {
  static error(message: string, status: number, error: any) {
    logger.error({
      date: new Date().toISOString(),
      status,
      message,
      error,
    });
  }

  static info(...messages: any[]) {
    if (process.env.NODE_ENV === "prod") return;
    console.info(chalk.yellow(messages));
  }

  static debug(...messages: any[]) {
    console.debug(chalk.blue(messages));
  }

  static verbose(...messages: any[]) {
    if (process.env.NODE_ENV === "prod") return;
    console.log(chalk.magenta(messages));
  }

  static log(...messages: any[]) {
    if (process.env.NODE_ENV === "prod") return;
    console.log(messages);
  }
}

export { Logger, logger };
