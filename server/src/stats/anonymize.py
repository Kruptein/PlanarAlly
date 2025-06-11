import hashlib
import os

from ..utils import DATA_DIR

STATS_PEPPER = None
pepper_path = DATA_DIR / "stats_pepper"

if not pepper_path.exists():
    STATS_PEPPER = os.urandom(32)
    with open(pepper_path, "wb") as f:
        f.write(STATS_PEPPER)
else:
    with open(pepper_path, "rb") as f:
        STATS_PEPPER = f.read().strip()


def anonymize(value: int | str) -> str:
    # Fall back to a random pepper if the file somehow fails
    pepper = STATS_PEPPER or os.urandom(32)

    return hashlib.sha256(str(value).encode() + pepper).hexdigest()
