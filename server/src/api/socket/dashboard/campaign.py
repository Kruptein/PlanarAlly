import asyncio

from .... import auth
from ....app import app, sio
from ....config import cfg
from ....db.models.room import Room
from ....export.campaign import export_campaign
from ....logs import logger
from ....state.dashboard import dashboard_state
from ..constants import DASHBOARD_NS


@sio.on("Campaign.Export", namespace=DASHBOARD_NS)
@auth.login_required(app, sio, "dashboard")
async def _export_campaign(sid: str, campaign_name: str):
    if not cfg().general.enable_export:
        return

    user = dashboard_state.get_user(sid)

    room: Room | None = Room.get_or_none(name=campaign_name, creator=user)
    if room is None:
        logger.warning(f"Attempt to export campaign that does not exist. [{campaign_name}-{user.name}]")
        return

    filename = f"{campaign_name}-{user.name}"
    await asyncio.create_task(export_campaign(filename, [room], sid=sid))
