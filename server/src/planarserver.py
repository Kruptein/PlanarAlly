"""
PlanarAlly backend server code.
This is the code responsible for starting the backend and reacting to socket IO events.
"""

import asyncio
import configparser
import getpass
import mimetypes
import os
import sys
from argparse import ArgumentParser
from pathlib import Path
from types import SimpleNamespace
from typing import Literal
from urllib.parse import quote, unquote

from aiohttp import web

# It's **essential** that the config is imported first
from . import config, save
from .config.types import WebserverConfig
from .db.db import db
from .db.models.room import Room
from .db.models.user import User
from .utils import FILE_DIR

save_newly_created = save.check_existence()

loop = asyncio.new_event_loop()

if not save_newly_created:
    save.upgrade_save(loop=loop)

from . import routes, stats  # noqa: F401, E402
from .api import http  # noqa: F401, E402

# Force loading of socketio routes
from .api.socket import load_socket_commands  # noqa: E402
from .app import (  # noqa: E402
    admin_app,  # noqa: E402
    runners,
    setup_runner,
    sio,
)
from .app import app as main_app  # noqa: E402
from .logs import logger  # noqa: E402
from .state.asset import asset_state  # noqa: E402
from .state.dashboard import dashboard_state  # noqa: E402
from .state.game import game_state  # noqa: E402

load_socket_commands()

# This is a fix for asyncio problems on windows that make it impossible to do ctrl+c
if sys.platform.startswith("win"):

    def _wakeup():
        loop.call_later(0.1, _wakeup)

    loop.call_later(0.1, _wakeup)


async def on_cleanup(_):
    # Stop config observer
    config.config_manager.cleanup()

    # Close database connection
    db.close()

    stats.events.server_stopped()


async def on_shutdown(_):
    print(" Shutting down, this can take a couple of seconds...")

    # Close socket connections
    for state in [asset_state, dashboard_state, game_state]:
        await state.disconnect_all()

    await sio.shutdown()


async def start_http(app: web.Application, host, port):
    logger.warning(" RUNNING IN NON SSL CONTEXT ")
    await setup_runner(app, web.TCPSite, host=host, port=port)


async def start_https(app: web.Application, host, port, chain: Path, key: Path):
    import ssl

    ctx = ssl.SSLContext()
    try:
        if not chain.is_absolute():
            chain = FILE_DIR / chain
        if not key.is_absolute():
            key = FILE_DIR / key
        ctx.load_cert_chain(chain, key)
    except FileNotFoundError:
        logger.critical("SSL FILES ARE NOT FOUND. ABORTING LAUNCH.")
        sys.exit(2)

    await setup_runner(
        app,
        web.TCPSite,
        host=host,
        port=port,
        ssl_context=ctx,
    )


async def start_socket(app: web.Application, sock):
    await setup_runner(app, web.UnixSite, path=sock)


async def start_server(server_section: Literal["Webserver", "APIserver"], cfg: WebserverConfig):
    app = main_app
    method = "unknown"

    connection = cfg.connection

    if server_section == "APIserver":
        app = admin_app

    if connection.type == "socket":
        await start_socket(app, connection.socket)
        method = f"socket://{connection.socket}"
    else:
        host = connection.host
        port = connection.port

        environ = os.environ.get("PA_BASEPATH", "/")

        if cfg.ssl and cfg.ssl.enabled:
            try:
                chain = Path(cfg.ssl.fullchain)
                key = Path(cfg.ssl.privkey)
            except configparser.NoOptionError:
                logger.critical("SSL CONFIGURATION IS NOT CORRECTLY CONFIGURED. ABORTING LAUNCH.")
                sys.exit(2)

            await start_https(app, host, port, chain, key)
            method = f"https://{host}:{port}{environ}"
        else:
            await start_http(app, host, port)
            method = f"http://{host}:{port}{environ}"

    print(f"======== Starting {server_section} on {method} ========")


async def start_servers():
    cfg = config.cfg()
    print()
    await start_server("Webserver", cfg.webserver)
    print()
    if cfg.apiserver:
        await start_server("APIserver", cfg.apiserver)
    else:
        print("API Server disabled")
    print()
    print("(Press CTRL+C to quit)")
    print()
    stats.events.server_started()


def server_main(args):
    """Start the PlanarAlly server."""

    # Check for existence of './templates/' as it is not present if client was not built before
    if (not (FILE_DIR / "templates").exists()) and args.dev:
        print("You must first build the client, before starting the server.")
        url = "https://www.planarally.io/server/setup/self-hosting/"
        print(f"See {url} on how to build the client or import a pre-built client.")
        sys.exit(1)

    # Mimetype recognition for js files apparently is not always properly setup out of the box
    # for some users out there.
    mimetypes.init()
    mimetypes.types_map[".js"] = "application/javascript; charset=utf-8"

    loop.create_task(start_servers())
    loop.create_task(stats.data.start_tracking())

    try:
        main_app.on_cleanup.append(on_cleanup)
        main_app.on_shutdown.append(on_shutdown)

        loop.run_forever()
    except:
        pass
    finally:
        for runner in runners:
            loop.run_until_complete(runner.cleanup())


def list_main(args):
    """List all of the requested resource type."""
    resource = args.resource.lower()
    if resource == "user":
        for user in User.select():
            print(user.name)
    elif resource == "room":
        for room in Room.select():
            print(f"{quote(room.creator.name, safe='')}/{quote(room.name, safe='')}")


def get_room(path) -> Room:
    try:
        user, room = path.split("/")
    except ValueError:
        print("Invalid room. The room should have a single '/'")
        sys.exit(1)

    user = User.by_name(unquote(user))

    return Room.get(name=unquote(room), creator=user)


def remove_main(args):
    """Remove a requested resource."""
    resource = args.resource.lower()

    if resource == "user":
        if user := User.by_name(args.name):
            user.delete_instance(recursive=True)
    elif resource == "room":
        room = get_room(args.name)
        room.delete_instance(recursive=True)


def reset_password_main(args):
    """Reset a users password. Will prompt for the new password if not provided."""
    password = args.password
    user = User.by_name(args.name)

    if not user:
        print(f"User with name {args.name} not found.")
        sys.exit(1)

    if not password:
        first_password = getpass.getpass()
        second_password = getpass.getpass("Retype password:")
        while first_password != second_password:
            print("Passwords do not match.")
            first_password = getpass.getpass()
            second_password = getpass.getpass("Retype password:")
        password = first_password
    user.set_password(password)
    user.save()


def add_subcommand(name, func, parent_parser, args):
    sub_parser = parent_parser.add_parser(name, help=func.__doc__)
    for arg in args:
        sub_parser.add_argument(arg[0], **arg[1])
    sub_parser.set_defaults(func=func)


def main():
    if len(sys.argv) < 2 or (len(sys.argv) == 2 and sys.argv[1] == "dev"):
        # To keep the previous syntax, if this script is called with no args,
        # Or with just dev, we should start the server.
        args = SimpleNamespace(dev=len(sys.argv) == 2)
        server_main(args)
        return

    parser = ArgumentParser()
    subparsers = parser.add_subparsers()

    add_subcommand(
        "serve",
        server_main,
        subparsers,
        [
            (
                "dev",
                {
                    "nargs": "?",
                    "choices": ["dev"],
                    "help": "Start the server with a development version of the client.",
                },
            )
        ],
    )

    resource_names = ["room", "user"]

    add_subcommand(
        "list",
        list_main,
        subparsers,
        [("resource", {"choices": resource_names, "help": "The resource to list."})],
    )

    add_subcommand(
        "remove",
        remove_main,
        subparsers,
        [
            (
                "resource",
                {"choices": resource_names, "help": "The type of resource to remove"},
            ),
            ("name", {"help": "The name of the resource to remove"}),
        ],
    )

    add_subcommand(
        "reset",
        reset_password_main,
        subparsers,
        [
            ("name", {"help": "The name of the user."}),
            (
                "--password",
                {"help": "The new password. Will be prompted for if not provided."},
            ),
        ],
    )

    options = parser.parse_args()
    options.func(options)


if __name__ == "__main__":
    main()
