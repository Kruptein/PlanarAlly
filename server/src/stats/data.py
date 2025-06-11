import asyncio
from datetime import datetime, timedelta

import aiohttp

from ..api.http.version import env_version, release_version
from ..config import cfg
from ..db.models.constants import Constants
from ..db.models.room import Room
from ..db.models.stats import Stats
from ..db.models.user import User
from ..logs import logger


async def send_stats(data):
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{cfg().stats.stats_url}/api/stats",
            json=data,
        ) as response:
            response.raise_for_status()


async def export_stats():
    c = Constants.get()

    # Get all entries since last export
    stats = Stats.select()
    if c.last_export_date:
        stats = stats.where(Stats.timestamp > c.last_export_date)

    if len(stats) == 0:
        return

    data = {
        "stats": [s.to_export_format() for s in stats],
        "serverId": c.stats_uuid,
        "totals": {
            "users": User.select().count(),
            "rooms": Room.select().count(),
        },
        "versions": {
            "serverEnv": env_version,
            "serverRelease": release_version,
            "statsFormat": 1,
        },
    }

    try:
        await send_stats(data)
    except Exception as e:
        logger.warning(f"Error exporting stats: {e}")
        return

    # Update last export date
    c.last_export_date = datetime.now()
    c.save()


async def start_tracking():
    if not cfg().stats.enable_export:
        return

    last_export_date = Constants.get().last_export_date

    if last_export_date is None or last_export_date < datetime.now() - timedelta(days=1):
        await export_stats()

    # Once a day save the stats to the database
    while True:
        await asyncio.sleep(cfg().stats.export_frequency_in_seconds)

        await export_stats()
