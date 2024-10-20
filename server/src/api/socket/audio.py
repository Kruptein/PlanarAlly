from aiohttp import web
from ...app import sio, app
from ... import auth
from ...api.socket.constants import GAME_NS
from ...state.game import game_state
from ...db.models.player_room import PlayerRoom
from typing import Any
from ..models.audio import ApiAudioMessage
from ..helpers import _send_game

# Dictionary to keep track of current audio for each room

@sio.on("Audio.Play", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def play_audio(sid: str, raw_data: Any):
    """
    Handles the request to play an audio file in a specific room.
    The DM will send the audio file ID and room name.
    """
    pr: PlayerRoom = game_state.get(sid)
    data = ApiAudioMessage(**raw_data)
    await _send_game("Audio.Play", data, room=pr.room.get_path(), skip_sid=sid)

@sio.on("Audio.Stop", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def stop_audio(sid: str, raw_data: Any):
    """
    Handles the request to stop the audio in a specific room.
    """
    pr: PlayerRoom = game_state.get(sid)
    data = ApiAudioMessage(**raw_data)
    await _send_game("Audio.Stop", data, room=pr.room.get_path(), skip_sid=sid)

@sio.on("Audio.ToggleLoop", namespace=GAME_NS)
@auth.login_required(app, sio, "game")
async def loop_audio(sid: str, raw_data: Any):
    """
    Handles the request to toggle looping audio in a specific room.
    """
    pr: PlayerRoom = game_state.get(sid)
    data = ApiAudioMessage(**raw_data)
    await _send_game("Audio.ToggleLoop", data, room=pr.room.get_path(), skip_sid=sid)
