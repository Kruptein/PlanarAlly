import asyncio
from datetime import UTC, datetime, timedelta

import aiohttp

from ..api.http.version import env_version, release_version
from ..config import cfg
from ..db.models.constants import Constants
from ..db.models.room import Room
from ..db.models.stats import Stats
from ..db.models.user import User
from ..logs import logger


async def send_stats(data):
    async with (
        aiohttp.ClientSession() as session,
        session.post(
            f"{cfg().stats.stats_url}/api/stats",
            json=data,
        ) as response,
    ):
        response.raise_for_status()


async def export_stats():
    c = Constants.get()

    # Get all entries since last export
    query = Stats.select().order_by(Stats.timestamp, Stats.id)
    if c.last_export_date:
        query = query.where(Stats.timestamp > c.last_export_date)
    stats = list(query)

    if len(stats) == 0:
        return

    for chunk in range(0, len(stats), 1000):
        batch = stats[chunk : chunk + 1000]
        data = {
            "stats": [s.to_export_format() for s in batch],
            "serverId": c.stats_uuid,
            "totals": {
                "users": User.select().count(),
                "rooms": Room.select().count(),
            },
            "versions": {
                "serverEnv": env_version,
                "serverRelease": release_version,
                "statsFormat": 3,
            },
        }

        try:
            await send_stats(data)
        except Exception as e:
            logger.warning(f"Error exporting stats: {e}")
            break

        # Only move past what was actually sent, so that events created during the export
        # or belonging to a failed chunk are picked up by the next export
        c.last_export_date = batch[-1].timestamp
        c.save()


async def start_tracking():
    if not cfg().stats.enable_export:
        return

    last_export_date = Constants.get().last_export_date

    if last_export_date is None or last_export_date < datetime.now(tz=UTC) - timedelta(days=1):
        await export_stats()

    # Once a day save the stats to the database
    while True:
        await asyncio.sleep(cfg().stats.export_frequency_in_seconds)

        await export_stats()
