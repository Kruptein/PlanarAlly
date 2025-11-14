import asyncio
import random
import secrets
import logging

from aiohttp import web
from aiohttp_security import authorized_userid, forget, remember

from ... import stats
from ...auth import get_authorized_user
from ...config import cfg
from ...db.db import db
from ...db.models.user import User
from ...mail import send_mail
from ...state.auth import auth_state
from .oidc import oidc_auth

async def is_authed(request):
    user = await get_authorized_user(request)

    if user is None:
        data = {"auth": False, "username": ""}
    else:
        data = {"auth": True, "username": user.name, "email": user.email}
        user.update_last_login()
    return web.json_response(data)


async def login(request):
    if "local" not in cfg().general.authentication_methods:
        return web.HTTPForbidden(reason="Local authentication is disabled")
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
    if "local" not in cfg().general.authentication_methods:
        return web.HTTPForbidden(reason="Local authentication is disabled")
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
    if "local" not in cfg().general.authentication_methods:
        return web.HTTPForbidden(reason="Local authentication is disabled")
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

async def oidc_providers(request):
    if "oidc" not in cfg().general.authentication_methods:
        return web.HTTPForbidden(reason="OIDC authentication is disabled")
    providers = oidc_auth.get_providers()
    return web.json_response({"providers": providers})

async def oidc_login(request):
    logger = logging.getLogger("PlanarAllyServer")
    if "oidc" not in cfg().general.authentication_methods:
        logger.warning(f"OIDC authentication attempted but disabled in config")
        return web.HTTPForbidden(reason="OIDC authentication is disabled")
    try:
        data = await request.json()
    except Exception as e:
        return web.HTTPBadRequest(reason="Invalid request format")
    
    # Grab the state from the browser's request ensuring we can validate it later
    provider_name = data.get("provider_name")
    if not provider_name:
        return web.HTTPBadRequest(reason="Missing required parameters")

    auth_url = await oidc_auth.get_authorization_url(provider_name)

    if not auth_url:
        return web.HTTPInternalServerError(reason="Failed to initiate OIDC login")
    logger.debug(f"Redirecting to OIDC provider with URL: {auth_url}")
    # Instruct the client to redirect to the auth_url
    return web.json_response({"authorization_url": auth_url})

async def oidc_callback(request):
    logger = logging.getLogger("PlanarAllyServer")
    logger.debug("OIDC callback invoked")
    if "oidc" not in cfg().general.authentication_methods:
        logger.warning(f"OIDC authentication attempted but disabled in config")
        return web.HTTPForbidden(reason="OIDC authentication is disabled")
    
    # Get the provider name from the URL path since we have multiple providers
    #  and cannot rely on a single endpoint
    provider_name = request.match_info["provider"]
    code = request.query.get("code")
    if not code or not provider_name:
        logger.error("Missing code or provider_name in OIDC callback request")
        return web.HTTPBadRequest(reason="Missing required parameters")

    try:
        user_info = await oidc_auth.exchange_code_for_token(code, provider_name, request.query.get("state"))
        if not user_info:
            logger.error("Failed to retrieve user info from OIDC provider")
            return web.HTTPUnauthorized(reason="OIDC authentication failed")
        
        
        if not user_info.username or not user_info.email:
            logger.error("OIDC user info missing username/email")
            return web.HTTPUnauthorized(reason="OIDC authentication failed")

        user = User.by_name(user_info.username) or User.by_email(user_info.email)
        if user is None:
            # Check if auto-signup is allowed
            if not cfg().general.allow_signups:
                logger.info(f"Auto-signup disabled, rejecting OIDC login for unknown user: {user_info.username}")
                return web.HTTPForbidden(reason="User does not exist and auto-signup is disabled")
            # Auto-register the user
            with db.atomic():
                # Generate a sufficiently random password, since it won't be used for login
                password = secrets.token_urlsafe(16)
                user = User.create_new(user_info.username, password, user_info.email)
                stats.events.user_created(user.id)
                logger.info(f"Auto-registered new user: {user_info.username}")
        response = web.HTTPOk()
        user.update_last_login()
        await remember(request, response, user_info.username)
        logger.info(f"User {user_info.username} logged in via OIDC")
        # Convert this response into a redirect for the browser
        # we need the the auth system to modify the response headers
        response.headers["Location"] = f"{cfg().general.client_url}"
        response.set_status(302)
        return response

    except Exception as e:
        logger.error(f"Error during OIDC callback processing: {e}")
        return web.HTTPInternalServerError(reason="An error occurred during OIDC authentication")
