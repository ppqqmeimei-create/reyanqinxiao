"""
GIS数据库升级执行脚本
自动读取 back-end/.env 中的数据库配置并执行 SQL/07_gis_upgrade.sql
用法: python run_gis_upgrade.py
"""
import os
import sys

# =====================
# 1. 读取 .env 配置
# =====================
def load_env(env_path):
    env = {}
    if not os.path.exists(env_path):
        return env
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                k, v = line.split('=', 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env


def main():
    # 项目根目录（本脚本放在项目根目录）
    root = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.join(root, 'back-end', '.env')
    sql_path = os.path.join(root, 'SQL', '07_gis_upgrade.sql')

    print(f'项目根目录: {root}')
    print(f'.env路径:   {env_path}')
    print(f'SQL路径:    {sql_path}')
    print()

    # 检查SQL文件
    if not os.path.exists(sql_path):
        print(f'❌ SQL文件不存在: {sql_path}')
        sys.exit(1)

    # 读取 .env
    env = load_env(env_path)

    # 尝试从 DATABASE_URL 解析 MySQL 连接信息
    db_url = env.get('DATABASE_URL', '')
    if not db_url:
        db_url = os.environ.get('DATABASE_URL', '')

    # 解析连接参数
    host = env.get('DB_HOST', 'localhost')
    port = env.get('DB_PORT', '3306')
    user = env.get('DB_USER', env.get('DB_USERNAME', 'root'))
    password = env.get('DB_PASSWORD', env.get('DB_PASS', ''))
    database = env.get('DB_NAME', env.get('DB_DATABASE', 'reyanjingxiao'))

    # 如果有 DATABASE_URL，从中解析
    if db_url and 'mysql' in db_url.lower():
        try:
            # mysql+pymysql://user:pass@host:port/dbname
            import re
            m = re.match(r'mysql[^:]*://([^:]+):([^@]*)@([^:/]+):?(\d+)?/([^?]+)', db_url)
            if m:
                user     = m.group(1)
                password = m.group(2)
                host     = m.group(3)
                port     = m.group(4) or '3306'
                database = m.group(5)
        except Exception:
            pass

    print(f'数据库连接信息:')
    print(f'  Host:     {host}:{port}')
    print(f'  User:     {user}')
    print(f'  Database: {database}')
    print(f'  Password: {"*" * len(password) if password else "(空)"}')
    print()

    # 如果密码为空，提示用户输入
    if not password:
        import getpass
        password = getpass.getpass(f'请输入 MySQL [{user}] 密码: ')

    # =====================
    # 2. 执行SQL
    # =====================
    try:
        import pymysql
    except ImportError:
        print('⚠️  pymysql 未安装，尝试 pip install pymysql...')
        os.system(f'{sys.executable} -m pip install pymysql -q')
        try:
            import pymysql
        except ImportError:
            print('❌ pymysql 安装失败，请手动安装: pip install pymysql')
            sys.exit(1)

    # 读取SQL文件内容
    with open(sql_path, 'r', encoding='utf-8') as f:
        sql_content = f.read()

    # 连接数据库（不指定database，因为SQL内部有 USE 语句）
    conn = None
    try:
        print('正在连接数据库...')
        conn = pymysql.connect(
            host=host,
            port=int(port),
            user=user,
            password=password,
            charset='utf8mb4',
            autocommit=True
        )
        cursor = conn.cursor()
        print('✅ 数据库连接成功\n')

        # 分割并逐条执行SQL语句
        # 过滤空语句和注释
        statements = []
        current = []
        for line in sql_content.splitlines():
            stripped = line.strip()
            # 跳过纯注释行
            if stripped.startswith('--') or stripped.startswith('#') or not stripped:
                continue
            current.append(line)
            if stripped.endswith(';'):
                stmt = '\n'.join(current).strip()
                if stmt:
                    statements.append(stmt)
                current = []

        print(f'共 {len(statements)} 条SQL语句待执行\n')

        success = 0
        warnings = 0
        errors = 0

        for i, stmt in enumerate(statements, 1):
            # 取第一行作为摘要
            summary = stmt.split('\n')[0][:80]
            try:
                cursor.execute(stmt)
                print(f'  [{i:3d}] ✅ {summary}')
                success += 1
            except pymysql.Warning as w:
                print(f'  [{i:3d}] ⚠️  {summary}')
                print(f'         警告: {w}')
                warnings += 1
            except pymysql.err.OperationalError as e:
                code = e.args[0]
                # 1060=字段已存在, 1061=索引已存在, 1050=表已存在(用IF NOT EXISTS已处理)
                if code in (1060, 1061, 1054):
                    print(f'  [{i:3d}] ⚠️  {summary}')
                    print(f'         跳过（已存在）: {e.args[1]}')
                    warnings += 1
                else:
                    print(f'  [{i:3d}] ❌ {summary}')
                    print(f'         错误: {e}')
                    errors += 1
            except Exception as e:
                print(f'  [{i:3d}] ❌ {summary}')
                print(f'         错误: {e}')
                errors += 1

        print()
        print('=' * 60)
        print(f'执行完成: ✅成功 {success} | ⚠️警告/跳过 {warnings} | ❌错误 {errors}')
        print('=' * 60)

        if errors == 0:
            print('\n🎉 GIS数据库升级成功！')
            print('   - pollution_sources 表已就绪（含20条测试数据）')
            print('   - task_locations 表已就绪')
            print('   - alerts/tasks 表已补充案件字段')
        else:
            print(f'\n⚠️  有 {errors} 条语句执行失败，请检查上方错误信息')

    except pymysql.err.OperationalError as e:
        print(f'❌ 数据库连接失败: {e}')
        print('请检查：')
        print('  1. MySQL服务是否已启动')
        print('  2. 用户名/密码是否正确')
        print('  3. back-end/.env 中的 DB_HOST/DB_USER/DB_PASSWORD 配置')
        sys.exit(1)
    finally:
        if conn:
            conn.close()


if __name__ == '__main__':
    main()
