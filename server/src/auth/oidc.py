import logging
from typing import Optional
import aiohttp
import urllib.parse

from ..config import cfg
from ..db.models.user import User

logger = logging.getLogger("PlanarAllyServer")


class OIDCAuth:
    def __init__(self):
        self.config = cfg().oidc
        self.client_id = None
        self.client_secret = None
        self.scope = self.config.scope
        self._discovery_cache: Optional[dict] = None
        self._setup_client()

    def _setup_client(self):
        """Setup OAuth2 client if OIDC is enabled"""
        if not self.config.enabled or not all([
            self.config.domain,
            self.config.client_id,
            self.config.client_secret
        ]):
            return

        try:
            self.client_id = self.config.client_id
            self.client_secret = self.config.client_secret
            # Client initialization successful - no need to log in production
        except Exception as e:
            logger.error(f"Failed to initialize OIDC client: {e}")
            self.client_id = None
            self.client_secret = None

    async def _get_discovery_document(self) -> Optional[dict]:
        """Get OIDC discovery document from provider"""
        if self._discovery_cache:
            return self._discovery_cache

        if not self.config.domain:
            return None

        try:
            # Handle both with and without protocol, but enforce HTTPS for security
            domain = self.config.domain
            if not domain.startswith(('http://', 'https://')):
                domain = f"https://{domain}"
            elif domain.startswith('http://'):
                logger.warning(f"Using insecure HTTP protocol for OIDC domain: {domain}")
                # For security, we should strongly discourage HTTP, but allow it for development
                # In production, consider raising an exception here instead
            
            discovery_url = f"{domain}/.well-known/openid-configuration"
            
            async with aiohttp.ClientSession() as session:
                async with session.get(discovery_url) as response:
                    if response.status == 200:
                        self._discovery_cache = await response.json()
                        return self._discovery_cache
                    else:
                        logger.error(f"Failed to get OIDC discovery document: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Failed to retrieve OIDC discovery document: {e}")
            return None

    def is_enabled(self) -> bool:
        """Check if OIDC authentication is enabled and properly configured"""
        enabled = (
            self.config.enabled and 
            self.client_id is not None and
            all([self.config.domain, self.config.client_id, self.config.client_secret])
        )
        
        # Skip enabled check logging in production
        
        return enabled

    async def get_authorization_url(self, redirect_uri: str, state: str) -> Optional[str]:
        """Get the authorization URL for OIDC login"""
        if not self.is_enabled():
            return None

        # Use direct URL if provided, otherwise use discovery
        if self.config.authorize_url:
            authorization_endpoint = self.config.authorize_url
            logger.debug("Using direct authorize URL") if logger.isEnabledFor(logging.DEBUG) else None
        else:
            discovery = await self._get_discovery_document()
            if not discovery:
                return None
            authorization_endpoint = discovery.get("authorization_endpoint")
            if not authorization_endpoint:
                logger.error("No authorization_endpoint found in discovery document")
                return None

        try:

            # Build authorization URL parameters
            params = {
                "client_id": self.client_id,
                "redirect_uri": redirect_uri,
                "state": state,
                "response_type": "code",
                "scope": self.scope,
            }
            
            # Add audience if configured (provider-specific)
            if self.config.audience:
                params["audience"] = self.config.audience

            # Build the authorization URL manually
            query_string = urllib.parse.urlencode(params)
            auth_url = f"{authorization_endpoint}?{query_string}"
            return auth_url
        except Exception as e:
            logger.error(f"Failed to generate authorization URL: {e}")
            return None

    async def exchange_code_for_token(self, code: str, redirect_uri: str) -> Optional[dict]:
        """Exchange authorization code for access token"""
        if not self.is_enabled():
            return None

        # Use direct URL if provided, otherwise use discovery
        if self.config.token_url:
            token_endpoint = self.config.token_url
            logger.debug("Using direct token URL") if logger.isEnabledFor(logging.DEBUG) else None
        else:
            discovery = await self._get_discovery_document()
            if not discovery:
                return None
            token_endpoint = discovery.get("token_endpoint")
            if not token_endpoint:
                logger.error("No token_endpoint found in discovery document")
                return None

        try:

            # Prepare token request data
            token_data = {
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": redirect_uri,
                "client_id": self.client_id,
                "client_secret": self.client_secret,
            }
            
            # Add audience if configured
            if self.config.audience:
                token_data["audience"] = self.config.audience

            # Make token request using aiohttp
            async with aiohttp.ClientSession() as session:
                async with session.post(token_endpoint, data=token_data) as response:
                    if response.status == 200:
                        token_json = await response.json()
                        return token_json
                    else:
                        error_text = await response.text()
                        logger.error(f"Token exchange failed: {response.status} - {error_text}")
                        return None
        except Exception as e:
            logger.error(f"Failed to exchange code for token: {e}")
            return None

    async def get_user_info(self, token: dict) -> Optional[dict]:
        """Get user information from the OIDC provider"""
        if not self.is_enabled() or not token:
            return None

        # Use direct URL if provided, otherwise use discovery
        if self.config.userinfo_url:
            userinfo_endpoint = self.config.userinfo_url
            logger.debug("Using direct userinfo URL") if logger.isEnabledFor(logging.DEBUG) else None
        else:
            discovery = await self._get_discovery_document()
            if not discovery:
                return None
            userinfo_endpoint = discovery.get("userinfo_endpoint")
            if not userinfo_endpoint:
                logger.error("No userinfo_endpoint found in discovery document")
                return None

        try:

            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {token['access_token']}"}
                async with session.get(userinfo_endpoint, headers=headers) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.error(f"Failed to get user info: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Failed to get user info: {e}")
            return None

    async def get_or_create_user(self, user_info: dict) -> Optional[User]:
        """Get existing user or create new user from OIDC user info"""
        if not user_info:
            return None

        # Extract user information with fallbacks
        email = user_info.get("email")
        
        # Get username from configured field first, then fallback to others
        configured_field = self.config.username_field
        name = user_info.get(configured_field)
        
        # If configured field is not available, try other common fields
        if not name:
            name = (user_info.get("preferred_username") or 
                    user_info.get("name") or 
                    user_info.get("nickname") or 
                    user_info.get("given_name") or
                    email.split("@")[0] if email else None)
        
        if not name:
            logger.error("No valid username found in OIDC user info")
            return None

        # Try to find existing user by email first, then by name
        user = None
        if email:
            user = User.by_email(email)
        
        if not user:
            user = User.by_name(name)

        # Create new user if not found
        if not user:
            try:
                # Check if signups are allowed 
                from ..config import cfg
                if not cfg().general.allow_signups:
                    logger.warning(f"OIDC user creation blocked - signups disabled: {name}")
                    return None

                # Create user with a secure random password
                import secrets
                random_password = secrets.token_urlsafe(32)
                user = User.create_new(name, random_password, email)
            except Exception as e:
                logger.error(f"Failed to create OIDC user: {e}")
                return None

        # Update email if it's different and not None
        if email and user.email != email:
            try:
                user.email = email
                user.save()
                logger.info(f"Updated email for user {name}")
            except Exception as e:
                logger.error(f"Failed to update email for user {name}: {e}")

        return user

    async def validate_token(self, token: str) -> Optional[dict]:
        """Validate an access token and return user info"""
        if not self.is_enabled():
            return None

        # Use direct URL if provided, otherwise use discovery
        if self.config.userinfo_url:
            userinfo_endpoint = self.config.userinfo_url
            logger.info(f"Using direct userinfo URL for validation: {userinfo_endpoint}")
        else:
            discovery = await self._get_discovery_document()
            if not discovery:
                return None
            userinfo_endpoint = discovery.get("userinfo_endpoint")
            if not userinfo_endpoint:
                logger.error("No userinfo_endpoint found in discovery document")
                return None

        try:

            async with aiohttp.ClientSession() as session:
                headers = {"Authorization": f"Bearer {token}"}
                async with session.get(userinfo_endpoint, headers=headers) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.error(f"Token validation failed: {response.status}")
                        return None
        except Exception as e:
            logger.error(f"Token validation failed: {e}")
            return None

    def get_provider_info(self) -> dict:
        """Get provider information for client-side display"""
        return {
            "name": self.config.provider_name,
            "enabled": self.is_enabled(),
            "domain": self.config.domain
        }


# Global OIDC instance
oidc_auth = OIDCAuth()