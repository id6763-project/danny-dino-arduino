class LogManager {
  logs: string[];

  constructor() {
    this.logs = [];
  }

  log(message: string, level: 'info' | 'error' = 'info') {
    const logMessage = `[${level.toUpperCase()}] [${new Date().toLocaleString()}] ${message}`;
    if (level === 'info') {
      console.log(logMessage);
    } else {
      console.error(logMessage);
    }
    this.logs.push(logMessage);
  }

  error(errorMessage: string) {
    this.log(errorMessage, 'error');
  }

  info(message: string) {
    this.log(message);
  }

  getLogs() {
    return this.logs;
  }
}

export const logManager = new LogManager();
