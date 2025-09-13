import os
import sys
from functools import partial

import aiohttp
from aiohttp import web

from .api import http
from .api.http import auth, mods, notifications, rooms, server, users, version
from .api.http.admin import campaigns
from .api.http.admin import users as admin_users
from .app import admin_app, api_app
from .app import app as main_app
from .config import cfg
from .utils import ASSETS_DIR, FILE_DIR, STATIC_DIR

subpath = os.environ.get("PA_BASEPATH", "/")
if subpath[-1] == "/":
    subpath = subpath[:-1]


def __replace_config_data(data: bytes) -> bytes:
    config = cfg()

    # SIGNUP CONFIGURATION
    if not config.general.allow_signups:
        data = data.replace(b'name="PA-signup" content="true"', b'name="PA-signup" content="false"')
    
    # OIDC CONFIGURATION - Check first to determine if it's available
    oidc_fully_configured = (
        config.oidc.enabled and 
        config.oidc.client_id and 
        config.oidc.client_secret and
        bool(config.oidc.domain or config.oidc.authorize_url)  # Either domain for discovery OR direct URLs
    )
    
    # USERNAME/PASSWORD CONFIGURATION with fallback safety
    # If username/password is disabled BUT OIDC is not available, enable username/password as fallback
    username_pass_should_be_disabled = (
        not config.general.username_password_enabled and 
        oidc_fully_configured  # Only disable if OIDC is actually available
    )
    
    if username_pass_should_be_disabled:
        data = data.replace(b'name="PA-username-pass" content="true"', b'name="PA-username-pass" content="false"')
    elif not config.general.username_password_enabled and not oidc_fully_configured:
        # Fallback activated: username/password was disabled but OIDC is not available
        # Keep username/password enabled to prevent users from being locked out
        pass  # Meta tag stays as content="true"
    
    # MAIL CONFIGURATION
    if config.mail is None or not config.mail.enabled or not config.mail.host or not config.mail.port or not config.mail.default_from_address:
        data = data.replace(b'name="PA-mail" content="true"', b'name="PA-mail" content="false"')
    
    if oidc_fully_configured:
        # Enable OIDC
        data = data.replace(b'name="PA-oidc" content="false"', b'name="PA-oidc" content="true"')
        
        # Set domain (for discovery or display)
        if config.oidc.domain:
            domain = config.oidc.domain.replace('"', '&quot;')
            data = data.replace(b'name="PA-oidc-domain" content=""', f'name="PA-oidc-domain" content="{domain}"'.encode())
        
        # Set client ID
        if config.oidc.client_id:
            client_id = config.oidc.client_id.replace('"', '&quot;')
            data = data.replace(b'name="PA-oidc-client-id" content=""', f'name="PA-oidc-client-id" content="{client_id}"'.encode())
        
        # Set audience if present
        if config.oidc.audience:
            audience = config.oidc.audience.replace('"', '&quot;')
            data = data.replace(b'name="PA-oidc-audience" content=""', f'name="PA-oidc-audience" content="{audience}"'.encode())
        
        # Set provider name
        if config.oidc.provider_name:
            provider = config.oidc.provider_name.replace('"', '&quot;')
            data = data.replace(b'name="PA-oidc-provider" content="OIDC"', f'name="PA-oidc-provider" content="{provider}"'.encode())
    
    return data



async def root(request, admin_api=False):
    template = "admin-index.html" if admin_api else "index.html"
    with open(FILE_DIR / "templates" / template, "rb") as f:
        data = __replace_config_data(f.read())
        return web.Response(body=data, content_type="text/html")


async def root_dev(request, admin_api=False):
    port = 8081 if admin_api else 8080
    target_url = f"http://localhost:{port}{request.rel_url}"
    data = await request.read()
    async with aiohttp.ClientSession() as client:
        async with client.get(target_url, headers=request.headers, data=data) as response:
            raw = __replace_config_data(await response.read())
    return web.Response(body=raw, status=response.status, headers=response.headers)


# MAIN ROUTES

main_app.router.add_static(f"{subpath}/static/assets", ASSETS_DIR)
main_app.router.add_static(f"{subpath}/static", STATIC_DIR)
main_app.router.add_get(f"{subpath}/api/auth", auth.is_authed)
main_app.router.add_post(f"{subpath}/api/users/email", users.set_email)
main_app.router.add_post(f"{subpath}/api/users/password", users.set_password)
main_app.router.add_post(f"{subpath}/api/users/delete", users.delete_account)
main_app.router.add_post(f"{subpath}/api/login", auth.login)
main_app.router.add_post(f"{subpath}/api/register", auth.register)
main_app.router.add_post(f"{subpath}/api/logout", auth.logout)
main_app.router.add_post(f"{subpath}/api/forgot-password", auth.forgot_password)
main_app.router.add_post(f"{subpath}/api/reset-password", auth.reset_password)
main_app.router.add_post(f"{subpath}/api/oidc/login", auth.oidc_login)
main_app.router.add_post(f"{subpath}/api/oidc/exchange", auth.oidc_callback)
main_app.router.add_post(f"{subpath}/api/oidc/validate", auth.oidc_validate)
main_app.router.add_get(f"{subpath}/api/oidc/config", auth.check_oidc_config)  # Debug endpoint
main_app.router.add_get(f"{subpath}/api/server/upload_limit", server.get_limit)
main_app.router.add_get(f"{subpath}/api/rooms", rooms.get_list)
main_app.router.add_post(f"{subpath}/api/rooms", rooms.create)
main_app.router.add_patch(f"{subpath}/api/rooms/{{creator}}/{{roomname}}", rooms.patch)
main_app.router.add_delete(f"{subpath}/api/rooms/{{creator}}/{{roomname}}", rooms.delete)
main_app.router.add_patch(f"{subpath}/api/rooms/{{creator}}/{{roomname}}/info", rooms.set_info)
main_app.router.add_get(f"{subpath}/api/rooms/{{creator}}/{{roomname}}/export", rooms.export)
main_app.router.add_get(f"{subpath}/api/rooms/{{creator}}/export", rooms.export_all)
main_app.router.add_post(f"{subpath}/api/rooms/import/{{name}}", rooms.import_info)
main_app.router.add_post(f"{subpath}/api/rooms/import/{{name}}/{{chunk}}", rooms.import_chunk)
main_app.router.add_post(f"{subpath}/api/invite", http.claim_invite)
main_app.router.add_get(f"{subpath}/api/version", version.get_version)
main_app.router.add_get(f"{subpath}/api/changelog", version.get_changelog)
main_app.router.add_get(f"{subpath}/api/notifications", notifications.collect)
main_app.router.add_post(f"{subpath}/api/mod/upload", mods.upload)

# ADMIN ROUTES

api_app.router.add_post(f"{subpath}/notifications", notifications.create)
api_app.router.add_get(f"{subpath}/notifications", notifications.collect)
api_app.router.add_delete(f"{subpath}/notifications/{{uuid}}", notifications.delete)
api_app.router.add_get(f"{subpath}/users", admin_users.collect)
api_app.router.add_post(f"{subpath}/users/reset", admin_users.reset)
api_app.router.add_post(f"{subpath}/users/remove", admin_users.remove)
api_app.router.add_get(f"{subpath}/campaigns", campaigns.collect)

admin_app.router.add_static(f"{subpath}/static", STATIC_DIR)
admin_app.add_subapp("/api/", api_app)

TAIL_REGEX = "/{tail:(?!api).*}"
if "dev" in sys.argv:
    main_app.router.add_route("*", TAIL_REGEX, root_dev)
    admin_app.router.add_route("*", TAIL_REGEX, partial(root_dev, admin_api=True))
else:
    main_app.router.add_route("*", TAIL_REGEX, root)
    admin_app.router.add_route("*", TAIL_REGEX, partial(root, admin_api=True))
