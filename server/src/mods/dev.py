import re
from dataclasses import dataclass
from pathlib import Path

import rtoml
from pydantic import ValidationError

from ..api.models.mods import ApiModMeta, ModToml
from ..config import cfg
from ..logs import logger
from ..utils import FILE_DIR

_TAG = re.compile(r"^[A-Za-z0-9_-]+$")


@dataclass(frozen=True)
class DevMod:
    tag: str
    toml_path: Path
    asset_root: Path
    meta: ApiModMeta


_by_tag: dict[str, DevMod] = {}
_warned: set[str] = set()


def configured_roots() -> list[Path]:
    roots: list[Path] = []
    for raw in cfg().mods.dev_directories:
        path = Path(raw)
        if not path.is_absolute():
            path = FILE_DIR / path
        roots.append(path)
    return roots


def load_dev_mods() -> list[ApiModMeta]:
    """Rescan configured directories and return the dev mods that loaded."""
    found: dict[str, DevMod] = {}
    if not cfg().mods.dev_directories:
        _by_tag.clear()
        return []
    for root in configured_roots():
        if not root.exists():
            _warn_once(f"Dev mod path does not exist: {root}")
            continue
        if not root.is_dir():
            _warn_once(f"Dev mod path is not a directory: {root}")
            continue
        direct = _read_mod(root)
        if direct is not None:
            _keep(found, direct)
            continue
        for child in sorted(root.iterdir()):
            if not child.is_dir():
                continue
            mod = _read_mod(child)
            if mod is not None:
                _keep(found, mod)
    _by_tag.clear()
    _by_tag.update(found)
    return [mod.meta for mod in found.values()]


def resolve_dev_file(tag: str, filepath: str) -> Path | None:
    mod = _by_tag.get(tag)
    if mod is None:
        load_dev_mods()
        mod = _by_tag.get(tag)
    if mod is None or not _safe_relative(filepath):
        return None
    root = mod.asset_root.resolve()
    target = (root / filepath).resolve()
    if not target.is_relative_to(root) or not target.is_file():
        return None
    return target


def _warn_once(message: str) -> None:
    if message in _warned:
        return
    _warned.add(message)
    logger.warning(message)


def dev_signature(mods: list[ApiModMeta]) -> tuple[tuple[str, str], ...]:
    return tuple((mod.tag, mod.reloadToken) for mod in mods)


def _keep(found: dict[str, DevMod], mod: DevMod) -> None:
    if mod.tag in found:
        _warn_once(f"Duplicate dev mod tag {mod.tag}; keeping {found[mod.tag].toml_path}")
        return
    found[mod.tag] = mod


def _read_mod(folder: Path) -> DevMod | None:
    located = _locate(folder)
    if located is None:
        return None
    toml_path, asset_root = located
    try:
        parsed = ModToml(**rtoml.loads(toml_path.read_text()))
    except (OSError, rtoml.TomlParsingError, UnicodeDecodeError, ValidationError) as error:
        _warn_once(f"Skipping dev mod {folder}: {error}")
        return None
    meta = parsed.mod
    if not _TAG.fullmatch(meta.tag):
        _warn_once(f"Skipping dev mod {folder}: tag must match [A-Za-z0-9_-]+")
        return None
    return DevMod(
        tag=meta.tag,
        toml_path=toml_path,
        asset_root=asset_root,
        meta=ApiModMeta(
            apiSchema=meta.apiSchema,
            tag=meta.tag,
            name=meta.name,
            version=meta.version,
            author=meta.author,
            shortDescription=meta.shortDescription,
            description=meta.description,
            hash="dev",
            hasCss=(asset_root / "index.css").is_file(),
            dev=True,
            reloadToken=str(_newest_mtime_ns(asset_root, toml_path)),
        ),
    )


def _locate(folder: Path) -> tuple[Path, Path] | None:
    """Return the mod.toml path and the directory that contains index.js."""
    if (folder / "mod.toml").is_file() and (folder / "dist" / "index.js").is_file():
        return folder / "mod.toml", folder / "dist"
    if (folder / "mod.toml").is_file() and (folder / "index.js").is_file():
        return folder / "mod.toml", folder
    if (folder / "index.js").is_file() and (folder.parent / "mod.toml").is_file():
        return folder.parent / "mod.toml", folder
    return None


def _newest_mtime_ns(asset_root: Path, toml_path: Path) -> int:
    newest = toml_path.stat().st_mtime_ns
    for path in asset_root.rglob("*"):
        if not path.is_file() or "node_modules" in path.parts:
            continue
        try:
            newest = max(newest, path.stat().st_mtime_ns)
        except OSError:
            continue
    return newest


def _safe_relative(filepath: str) -> bool:
    if filepath.startswith(("/", "\\")) or "\\" in filepath:
        return False
    parts = Path(filepath).parts
    return bool(parts) and not any(part in {"..", "node_modules", ".git"} for part in parts)
