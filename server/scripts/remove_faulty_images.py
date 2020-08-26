"""
This is a simple script responsible for removing assets that got added as assets to your game by dragging something (e.g. some html element) on the board.
These should not trigger shape creation, but did in the past and would spam warnings in the console when drawing the game board.

This script should in principle only be ran once after upgrading to 0.22.0. (or regularly if you are on an earlier version and annoyed by the messages).

Usage: `python remove_faulty_images.py` or `python scripts/remove_faulty_images.py` from the server folder
"""
import sys
from pathlib import Path

# Insert parent folder in the lookup
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from models import AssetRect


def remove_assets():
    removed = AssetRect.delete().where(AssetRect.src.startswith("/game/")).execute()
    print(f"Removed {removed} assets that should not exist.")


if __name__ == "__main__":
    remove_assets()
