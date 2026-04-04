import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 日志级别
const LOG_LEVELS = {
  ERROR: 'ERROR',
  WARN: 'WARN',
  INFO: 'INFO',
  DEBUG: 'DEBUG'
};

// 日志颜色 (用于控制台输出)
const COLORS = {
  ERROR: '\x1b[31m',    // 红色
  WARN: '\x1b[33m',     // 黄色
  INFO: '\x1b[36m',     // 青色
  DEBUG: '\x1b[35m',    // 紫色
  RESET: '\x1b[0m'      // 重置
};

class Logger {
  constructor() {
    this.logDir = path.join(__dirname, '../../logs');
    this.ensureLogDir();
  }

  /**
   * 确保日志目录存在
   */
  ensureLogDir() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * 获取日志文件路径
   */
  getLogFilePath(level) {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `${level.toLowerCase()}-${date}.log`);
  }

  /**
   * 格式化日志消息
   */
  formatMessage(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const dataStr = Object.keys(data).length > 0 ? JSON.stringify(data) : '';
    return `[${timestamp}] [${level}] ${message} ${dataStr}`;
  }

  /**
   * 写入日志文件
   */
  writeToFile(level, message, data) {
    try {
      const filePath = this.getLogFilePath(level);
      const logMessage = this.formatMessage(level, message, data);
      fs.appendFileSync(filePath, logMessage + '\n');
    } catch (error) {
      console.error('Failed to write log file:', error);
    }
  }

  /**
   * 输出到控制台
   */
  logToConsole(level, message, data) {
    const color = COLORS[level] || COLORS.INFO;
    const timestamp = new Date().toISOString();
    const dataStr = Object.keys(data).length > 0 ? JSON.stringify(data) : '';
    
    console.log(
      `${color}[${timestamp}] [${level}] ${message}${dataStr ? ' ' + dataStr : ''}${COLORS.RESET}`
    );
  }

  /**
   * 记录错误日志
   */
  error(message, data = {}) {
    this.writeToFile(LOG_LEVELS.ERROR, message, data);
    this.logToConsole(LOG_LEVELS.ERROR, message, data);
  }

  /**
   * 记录警告日志
   */
  warn(message, data = {}) {
    this.writeToFile(LOG_LEVELS.WARN, message, data);
    this.logToConsole(LOG_LEVELS.WARN, message, data);
  }

  /**
   * 记录信息日志
   */
  info(message, data = {}) {
    this.writeToFile(LOG_LEVELS.INFO, message, data);
    this.logToConsole(LOG_LEVELS.INFO, message, data);
  }

  /**
   * 记录调试日志
   */
  debug(message, data = {}) {
    if (process.env.NODE_ENV === 'development') {
      this.writeToFile(LOG_LEVELS.DEBUG, message, data);
      this.logToConsole(LOG_LEVELS.DEBUG, message, data);
    }
  }

  /**
   * 记录API请求
   */
  logRequest(req) {
    this.info('API Request', {
      method: req.method,
      path: req.path,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  }

  /**
   * 记录API响应
   */
  logResponse(req, statusCode, duration) {
    this.info('API Response', {
      method: req.method,
      path: req.path,
      statusCode,
      duration: `${duration}ms`,
      userId: req.user?.id
    });
  }

  /**
   * 记录数据库操作
   */
  logDatabase(operation, collection, data = {}) {
    this.debug('Database Operation', {
      operation,
      collection,
      ...data
    });
  }

  /**
   * 记录任务操作
   */
  logTaskOperation(operation, taskId, userId, changes = {}) {
    this.info('Task Operation', {
      operation,
      taskId,
      userId,
      changes
    });
  }
}

// 创建单例实例
const logger = new Logger();

export default logger;
