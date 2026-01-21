import os
from datetime import timedelta
import dotenv

class Config:
    dotenv.load_dotenv()
    SECRET_KEY = os.getenv('SECRET_KEY')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY')
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    
    SQLALCHEMY_DATABASE_URI = 'sqlite:///users.db'
    SMTP_CONFIGS = {
        'gmail.com': {
            'server': 'smtp.gmail.com',
            'port': 587,
            'use_tls': True
        },
        'default': {
            'server': 'smtp.zoho.com',
            'port': 587,
            'use_tls': True
        }
    }
    MAIL_SERVER = SMTP_CONFIGS['default']['server']
    MAIL_PORT = SMTP_CONFIGS['default']['port']
    MAIL_USE_TLS = SMTP_CONFIGS['default']['use_tls']
    CORS_RESOURCES = {
        r"/api/*": {
            "origins": ["*"],
            "methods": ["GET", "POST"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    }
