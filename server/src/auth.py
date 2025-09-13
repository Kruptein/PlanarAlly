# This module is kept for backward compatibility
# All auth functionality is now in the auth package
from .auth.core import get_authorized_user, AuthPolicy, login_required, get_secret_token, get_api_token, token_middleware

__all__ = ['get_authorized_user', 'AuthPolicy', 'login_required', 'get_secret_token', 'get_api_token', 'token_middleware']
