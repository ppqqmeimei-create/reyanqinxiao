"""
热眼擒枭后端项目 - Flask应用入口
"""
import os
from app import create_app

# 获取环境变量
config_name = os.environ.get('FLASK_ENV', 'development')

# 创建应用
app = create_app(config_name)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
