from .base import *

DEBUG = False

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'

# Security settings for production
if 'SECRET_KEY' in os.environ and len(os.environ['SECRET_KEY']) < 50:
    raise ValueError('SECRET_KEY must be at least 50 characters long in production')

ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')
