#!/bin/bash

# ============================================
# 热眼擒枭 - MySQL数据库备份脚本
# ============================================
# 用途: 定期备份MySQL数据库
# 频率: 建议每天执行一次 (通过crontab)
# 保留: 最近7天的备份

# 配置
BACKUP_DIR="/backup/mysql"
DB_NAME="reyanjingxiao"
DB_USER="root"
DB_PASSWORD="${MYSQL_PASSWORD}"
DB_HOST="localhost"
RETENTION_DAYS=7

# 创建备份目录
mkdir -p "$BACKUP_DIR"

# 生成备份文件名
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${DATE}.sql"
BACKUP_FILE_GZ="${BACKUP_FILE}.gz"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 开始备份数据库: $DB_NAME"

# 执行备份
mysqldump \
  -h "$DB_HOST" \
  -u "$DB_USER" \
  -p"$DB_PASSWORD" \
  --single-transaction \
  --quick \
  --lock-tables=false \
  "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份成功: $BACKUP_FILE"
  
  # 压缩备份文件
  gzip "$BACKUP_FILE"
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 压缩成功: $BACKUP_FILE_GZ"
  
  # 获取文件大小
  SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份文件大小: $SIZE"
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份失败!"
  exit 1
fi

# 删除旧备份 (保留最近7天)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 清理旧备份 (保留最近${RETENTION_DAYS}天)"
find "$BACKUP_DIR" -name "${DB_NAME}_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# 统计备份文件
BACKUP_COUNT=$(ls -1 "$BACKUP_DIR"/${DB_NAME}_*.sql.gz 2>/dev/null | wc -l)
echo "[$(date '+%Y-%m-%d %H:%M:%S')] 当前备份文件数: $BACKUP_COUNT"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] 备份完成!"

# ============================================
# 添加到crontab的方法:
# ============================================
# 1. 编辑crontab: crontab -e
# 2. 添加以下行 (每天凌晨2点执行):
#    0 2 * * * /path/to/backup.sh >> /var/log/mysql_backup.log 2>&1
# 3. 保存并退出
# ============================================

# ============================================
# 恢复数据库的方法:
# ============================================
# 1. 解压备份文件:
#    gunzip /backup/mysql/reyanjingxiao_20260315_020000.sql.gz
# 2. 恢复数据库:
#    mysql -u root -p reyanjingxiao < /backup/mysql/reyanjingxiao_20260315_020000.sql
# ============================================
