
from datetime import UTC, datetime
import aiohttp

from ...config import cfg, cfg_last_update
from ...logs import logger
from dataclasses import dataclass
from ...config.types import OidcConfig


class CodeCache: 
    """This service caches PKCE code challenges and states for OIDC authentication flows.
    
    Cache entries are removed after 5 minutes to keep memory usage low."""
    def __init__(self):
        self.cache = dict[str, dict]()
    
    def set(self, state: str, data: dict):
        """Set the data for the given state"""
        # Clear the cache of stale entries
        now = datetime.now(UTC)
        for key in list(self.cache.keys()):
            _, timestamp = self.cache[key]
            if (now - timestamp).total_seconds() > 300:
                del self.cache[key]
        self.cache[state] = (data, now)
    
    def get(self, state: str) -> dict | None:
        """Get and remove the data for the given state"""
        entry = self.cache.pop(state, None)
        if entry is None:
            return None
        data, timestamp = entry
        # Do not return stale entries
        if (datetime.now(UTC) - timestamp).total_seconds() > 300:
            return None
        return data
    

class OidcServerConfig:
    """Configuration for a single OIDC provider"""
    refreshed: bool = False

    def __init__(self, config: OidcConfig, redirect_uri: str): 
        self.display_name = config.display_name or "OpenID Connect"
        """The display name for this OIDC provider"""
        self.provider_id = config.provider_id
        """The id of the provider"""
        self.client_id = config.client_id
        """"The OIDC Client ID to use for authentication"""
        self.client_secret = config.client_secret
        """The OIDC Client Secret to use for authentication"""
        self.discovery_url = config.discovery_url
        """The OIDC Discovery URL used to fetch provider configuration"""
        self.redirect_uri = redirect_uri + config.provider_id
        """The Redirect URI for this provider"""
        self.scopes = config.scopes
        """The scopes to request during authentication"""
        self.username_claim = config.username_claim
        """The claim to use as the username"""
        self.email_claim = config.email_claim
        """The claim to use as the email"""
        self.doc = None
        """The OIDC discovery document, once fetched"""
        self.pkce = config.pkce
        """Whether to use PKCE (Proof Key for Code Exchange) during authentication"""


@dataclass
class ExchangeData:
    """Standardized data returned after exchanging code for token"""
    username: str
    email: str

class OIDCAuth:
    """Handles OIDC authentication logic
    
    Provides methods to get authorization URLs, exchange codes for tokens, and manages multiple OIDC providers.
    """
    # Set to the minimum time so that we always initialize on first call
    last_update: datetime = datetime.min.replace(tzinfo=UTC)

    def __init__(self):
        #self.last_update = datetime.min
        # For each configured OIDC provider, create an OidcConfig
        self.code_cache = CodeCache()
        self.providers = dict[str, OidcServerConfig]()

    def get_provider(self, provider_id: str) -> OidcServerConfig | None:
        """Get the OIDC provider configuration by ID
        
        Also refreshes the providers from the config if needed."""
        # check the config and remove any providers that are no longer present
        # Generate the redirect URI based on the server config
        # but only if the config has changed since last update
        if cfg_last_update() > self.last_update:
            self.last_update = cfg_last_update()
            logger.debug("Refreshing OIDC providers from config")
            redirect_uri = (cfg().general.client_url or "") + "/api/oidc/callback/"

            # Mark all providers as not refreshed first
            for provider_id in list(self.providers.keys()):
                self.providers[provider_id].refreshed = False
            
            # Now refresh from the config
            for oidc_cfg in cfg().oidc:
                provider: OidcServerConfig
                if oidc_cfg.provider_id not in self.providers:
                    provider = OidcServerConfig(oidc_cfg, redirect_uri)
                    self.providers[oidc_cfg.provider_id] = provider
                else:
                    provider = self.providers[oidc_cfg.provider_id]
                provider.refreshed = True
            
            # Remove any providers that were not refreshed
            for provider_id in list(self.providers.keys()):
                if not self.providers[provider_id].refreshed:
                    del self.providers[provider_id]

        return self.providers.get(provider_id)

    def get_providers(self) -> list[dict] | None:
        """Get a list of configured OIDC providers
        
            Returns a list of dictionaries with provider display names and IDs."""
        # This is often the first call, so we will attempt to get a None provider
        self.get_provider("") # Trigger load if needed
        return [
            {
                "display_name": provider.display_name,
                "provider_id": provider.provider_id,
            }
            for provider in self.providers.values()
        ]
    
    async def get_discovery_document(self, provider: OidcServerConfig) -> dict | None:
        """Fetch the OIDC discovery document for the given provider"""
        # Check if we have already fetched it
        if provider.doc is not None:
            return provider.doc
        
        async with aiohttp.ClientSession() as session:
            async with session.get(provider.discovery_url) as resp:
                if resp.status == 200:
                    doc = await resp.json()
                    provider.doc = doc # Cache the discovery document
                    return doc
                else:
                    logger.error(
                        f"Failed to fetch OIDC discovery document from {provider.discovery_url}: {resp.status}"
                    )
                    return None

    async def get_authorization_url(self, provider_id: str) -> str | None:
        """Generate the authorization URL for the OIDC provider"""
        
        provider = self.get_provider(provider_id)
        if not provider:
            return None

        discovery_doc = await self.get_discovery_document(provider)
        if not discovery_doc:
            return None

        auth_endpoint = discovery_doc.get("authorization_endpoint")
        if not auth_endpoint:
            logger.warning(f"Authorization endpoint not found in discovery document for provider '{provider_id}'")
            return None
        scope_str = " ".join(provider.scopes)
        if provider.pkce:
            # Generate a code challenge and verifier
            import secrets
            import hashlib
            import base64
            code_verifier = secrets.token_urlsafe(64)
            code_challenge = base64.urlsafe_b64encode(
                hashlib.sha256(code_verifier.encode()).digest()
            ).rstrip(b'=').decode('utf-8')
            state = secrets.token_urlsafe(16)
            # Cache the code verifier associated with this state
            self.code_cache.set(state, code_verifier)
            auth_url = (
                f"{auth_endpoint}?response_type=code&client_id={provider.client_id}"
                f"&redirect_uri={provider.redirect_uri}&scope={scope_str}"
                f"&code_challenge={code_challenge}&code_challenge_method=S256&state={state}"
            )
        else:
            auth_url = (
                f"{auth_endpoint}?response_type=code&client_id={provider.client_id}"
                f"&redirect_uri={provider.redirect_uri}&scope={scope_str}"
        )
        return auth_url
    
    async def exchange_code_for_token(self, code: str, provider_name: str, state: str | None = None) -> dict | None:
        """Exchange the authorization code for tokens"""

        provider = self.get_provider(provider_name)
        if not provider:
            return None
        discovery_doc = await self.get_discovery_document(provider)
        if not discovery_doc:
            return None

        token_endpoint = discovery_doc.get("token_endpoint")
        if not token_endpoint:
            logger.warning("Token endpoint not found in discovery document")
            return None

        user_info_endpoint = discovery_doc.get("userinfo_endpoint")
        if not user_info_endpoint:
            logger.warning("Userinfo endpoint not found in discovery document")
            return None

        data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": provider.redirect_uri,
            "client_id": provider.client_id,
            "client_secret": provider.client_secret,
        }
        if provider.pkce:
            if not state:
                logger.debug("State is required for PKCE but not provided")
                return None
            # Retrieve the code verifier from the cache
            code_verifier = self.code_cache.get(state)
            if not code_verifier:
                logger.debug("No code verifier found for the given state")
                return None
            data["code_verifier"] = code_verifier
        
        async with aiohttp.ClientSession() as session:
            async with session.post(token_endpoint, data=data) as resp:
                if resp.status == 200:
                    token_response = await resp.json()
                    # Now fetch user info
                    async with session.get(
                        user_info_endpoint,
                        headers={"Authorization": f"Bearer {token_response.get('access_token')}"}
                    ) as userinfo_resp:
                        if userinfo_resp.status == 200:
                            user_info = await userinfo_resp.json()
                            # Useful to track down issues with claim mappings
                            logger.debug(f"OIDC user info response: {user_info}")
                            return ExchangeData(
                                username=user_info.get(provider.username_claim, ""),
                                email=user_info.get(provider.email_claim, ""),
                            )
                        else:
                            logger.error(f"Failed to fetch user info: {userinfo_resp.status}")
                            return None
                else:
                    logger.error(f"Failed to exchange code for token: {resp.status}")
                    return None

        
oidc_auth = OIDCAuth()