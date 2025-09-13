import asyncio
import random

from aiohttp import web
from aiohttp_security import authorized_userid, forget, remember

from ... import stats
from ...auth import get_authorized_user
try:
    from ...auth.oidc import oidc_auth
except ImportError as e:
    import logging
    logger = logging.getLogger("PlanarAllyServer")
    logger.warning(f"Failed to import OIDC module: {e}. OIDC authentication will be disabled.")

    #stub for oidc_auth if the module is not available
    class _OIDCStub:
        def is_enabled(self):
            return False
        
        async def get_authorization_url(self, redirect_uri, state):
            return None
        
        async def exchange_code_for_token(self, code, redirect_uri):
            return None
        
        async def get_user_info(self, token):
            return None
        
        async def get_or_create_user(self, user_info):
            return None
        
        async def validate_token(self, token):
            return None
    
    oidc_auth = _OIDCStub()
from ...config import cfg
from ...db.db import db
from ...db.models.user import User
from ...mail import send_mail
from ...state.auth import auth_state


async def is_authed(request):
    user = await get_authorized_user(request)

    if user is None:
        data = {"auth": False, "username": ""}
    else:
        data = {"auth": True, "username": user.name, "email": user.email}
        user.update_last_login()
    return web.json_response(data)


async def login(request):
    try:
        user = await get_authorized_user(request)
    except web.HTTPUnauthorized:
        pass
    else:
        return web.json_response({"email": user.email})

    data = await request.json()
    username = data["username"]
    password = data["password"]
    u = User.by_name(username)
    if u is None or not u.check_password(password):
        return web.HTTPUnauthorized(reason="Username and/or Password do not match")
    response = web.json_response({"email": u.email})
    u.update_last_login()
    await remember(request, response, username)
    return response


async def register(request):
    if not cfg().general.allow_signups:
        return web.HTTPForbidden()

    if await authorized_userid(request) is not None:
        return web.HTTPOk()

    data = await request.json()
    username = data["username"]
    password = data["password"]
    email = data.get("email", None)
    if User.by_name(username):
        return web.HTTPConflict(reason="Username already taken")
    elif not username:
        return web.HTTPBadRequest(reason="Please provide a username")
    elif not password:
        return web.HTTPBadRequest(reason="Please provide a password")
    else:
        try:
            with db.atomic():
                user = User.create_new(username, password, email)
                stats.events.user_created(user.id)
        except:
            return web.HTTPServerError(
                reason="An unexpected error occured on the server during account creation.  Operation reverted."
            )
        response = web.HTTPOk()
        user.update_last_login()
        await remember(request, response, username)
        return response


async def logout(request):
    response = web.HTTPOk()
    await forget(request, response)
    return response


async def forgot_password(request):
    data = await request.json()
    email = data["email"]
    user = User.by_email(email)

    # If the email is not found,
    # we just return a 200 to avoid leaking information
    if user is None:
        await asyncio.sleep(random.randint(1, 5))
        return web.HTTPOk()

    reset_token = auth_state.add_reset_token(user.id)

    reset_url = f"{cfg().general.client_url}/auth/login?resetToken={reset_token}"

    # Send the email
    if not send_mail(
        "Password reset request",
        f"A password reset for the PlanarAlly account associated with this email address was requested. Visit {reset_url} to reset your password. If you did not do this, please ignore this email.",
        f"A password reset for the PlanarAlly account associated with this email address was requested. Visit <a href='{reset_url}'>{reset_url}</a> to reset your password.<br><br>If you did not do this, please ignore this email.",
        [email],
    ):
        return web.HTTPInternalServerError(reason="Failed to send email - check with your administrator")

    return web.HTTPOk()


async def reset_password(request):
    data = await request.json()
    token = data["token"]
    password = data["password"]

    uid = auth_state.get_uid_from_token(token)
    if uid is None:
        return web.HTTPNotFound()

    user = User.get_by_id(uid)
    user.set_password(password)
    user.save()

    return web.HTTPOk()

# OIDC Authentication endpoints
async def check_oidc_config(request):
    """Check OIDC configuration status"""
    import logging
    logger = logging.getLogger("PlanarAllyServer")
    
    try:
        config = cfg()
        
        # Debug logging to see what's being loaded
        # Skip raw config debug in production
        
        oidc_config_data = {
            "oidc_enabled": config.oidc.enabled,
            "oidc_domain": config.oidc.domain if config.oidc.enabled else None,
            "oidc_client_id": config.oidc.client_id if config.oidc.enabled else None,
            "oidc_provider_name": config.oidc.provider_name if config.oidc.enabled else None
        }
        
        # Skip config response debug in production
        
        return web.json_response(oidc_config_data)
    except Exception as e:
        logger.error(f"Error checking OIDC config: {e}")
        return web.json_response({"error": "Configuration check failed"}, status=500)


async def oidc_login(request):
    """Initiate OIDC login flow"""
    import logging
    logger = logging.getLogger("PlanarAllyServer")
    
    if not oidc_auth.is_enabled():
        logger.warning("OIDC login attempted but OIDC is not enabled")
        return web.HTTPNotFound(reason="OIDC is not enabled")
    
    try:
        data = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse OIDC login request: {e}")
        return web.HTTPBadRequest(reason="Invalid JSON in request body")
    
    redirect_uri = data.get("redirect_uri")
    state = data.get("state")
    
    if not redirect_uri or not state:
        logger.error(f"Missing OIDC login parameters: redirect_uri={redirect_uri}, state={state}")
        return web.HTTPBadRequest(reason="Missing redirect_uri or state")
    
    auth_url = await oidc_auth.get_authorization_url(redirect_uri, state)
    if not auth_url:
        logger.error("Failed to generate OIDC authorization URL")
        return web.HTTPInternalServerError(reason="Failed to generate authorization URL")
    
    return web.json_response({"auth_url": auth_url})


async def oidc_callback(request):
    """Handle OIDC callback"""
    import logging
    logger = logging.getLogger("PlanarAllyServer")
    
    if not oidc_auth.is_enabled():
        logger.warning("OIDC callback attempted but OIDC is not enabled")
        return web.HTTPNotFound(reason="OIDC is not enabled")
    
    try:
        data = await request.json()
    except Exception as e:
        logger.error(f"Failed to parse OIDC callback request: {e}")
        return web.HTTPBadRequest(reason="Invalid JSON in request body")
    
    code = data.get("code")
    redirect_uri = data.get("redirect_uri")
    
    if not code or not redirect_uri:
        logger.error(f"Missing OIDC callback parameters: code={bool(code)}, redirect_uri={redirect_uri}")
        return web.HTTPBadRequest(reason="Missing code or redirect_uri")
    
    # Exchange code for token
    token = await oidc_auth.exchange_code_for_token(code, redirect_uri)
    if not token:
        logger.error("Failed to exchange OIDC code for token")
        return web.HTTPUnauthorized(reason="Failed to exchange code for token")
    
    # Get user info
    user_info = await oidc_auth.get_user_info(token)
    if not user_info:
        logger.error("Failed to get user information from OIDC token")
        return web.HTTPUnauthorized(reason="Failed to get user information")
    
    # Get or create user
    user = await oidc_auth.get_or_create_user(user_info)
    if not user:
        logger.error("Failed to create or find user from OIDC user info")
        return web.HTTPInternalServerError(reason="Failed to create or find user")
    
    # Create session
    response = web.json_response({"username": user.name, "email": user.email})
    await remember(request, response, user.name)
    
    return response


async def oidc_config(request):
    """Debug endpoint to check OIDC configuration"""
    config = cfg()
    return web.json_response({
        "oidc_enabled": config.oidc.enabled,
        "oidc_domain": config.oidc.domain,
        "oidc_client_id": config.oidc.client_id,
        "oidc_client_secret_set": bool(config.oidc.client_secret),
        "oidc_audience": config.oidc.audience,
        "oidc_provider_name": config.oidc.provider_name,
        "oidc_auth_is_enabled": oidc_auth.is_enabled()
    })


async def oidc_validate(request):
    """Validate OIDC token"""
    if not oidc_auth.is_enabled():
        return web.HTTPNotFound()
    
    data = await request.json()
    token = data.get("token")
    
    if not token:
        return web.HTTPBadRequest(reason="Missing token")
    
    user_info = await oidc_auth.validate_token(token)
    if not user_info:
        return web.HTTPUnauthorized(reason="Invalid token")
    
    # Get or create user
    user = await oidc_auth.get_or_create_user(user_info)
    if not user:
        return web.HTTPInternalServerError(reason="Failed to create or find user")
    
    return web.json_response({
        "auth": True,
        "username": user.name,
        "email": user.email
    })
