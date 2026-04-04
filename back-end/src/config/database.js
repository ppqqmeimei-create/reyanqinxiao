import { Sequelize } from 'sequelize';
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// MySQL 数据库配置
const sequelize = new Sequelize(
  process.env.DB_NAME || 'reyanjingxiao',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: (msg) => logger.debug(msg),
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    timezone: '+08:00'
  }
);

// 测试数据库连接
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    logger.info('✅ MySQL 数据库连接成功');
    logger.info(`📊 数据库名称: ${process.env.DB_NAME || 'SQL'}`);
    
    // 同步数据库模型（开发环境）
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('✅ 数据库模型同步完成');
    }
    
    return sequelize;
  } catch (error) {
    logger.error('❌ MySQL 数据库连接失败:', error.message);
    process.exit(1);
  }
};

export { sequelize, connectDB };
export default connectDB;
