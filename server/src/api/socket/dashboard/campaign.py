from asyncio.log import logger
from typing import Optional

import auth
from api.socket.constants import DASHBOARD_NS
from app import app, sio
from export.campaign import export_campaign
from models.campaign import Room
from state.dashboard import dashboard_state


@sio.on("Campaign.Export", namespace=DASHBOARD_NS)
@auth.login_required(app, sio, "dashboard")
async def _export_campaign(sid: str, campaign_name: str):
    user = dashboard_state.get_user(sid)

    room: Optional[Room] = Room.get_or_none(name=campaign_name, creator=user)
    if room is None:
        logger.warning(
            f"Attempt to export campaign that does not exist. [{campaign_name}-{user.name}]"
        )
        return

    filename = f"{campaign_name}-{user.name}"
    await export_campaign(filename, [room])
    await sio.emit("Campaign.Export.Done", filename, room=sid, namespace=DASHBOARD_NS)
