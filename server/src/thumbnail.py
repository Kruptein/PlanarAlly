import io
import warnings
from pathlib import Path

from PIL import Image

from .utils import ASSETS_DIR, get_asset_hash_subpath

warnings.simplefilter("ignore", Image.DecompressionBombWarning)


def create_thumbnail_from_bytes(input_bytes, max_size=(200, 200)):
    image = Image.open(io.BytesIO(input_bytes))

    # Handle palette mode with potential transparency
    if image.mode == "P":
        image = image.convert("RGBA")

    # Calculate aspect ratio preserving dimensions
    original_width, original_height = image.size
    ratio = min(max_size[0] / original_width, max_size[1] / original_height)
    new_size = (int(original_width * ratio), int(original_height * ratio))

    # Resize using LANCZOS
    image = image.resize(new_size, Image.Resampling.LANCZOS)

    # Generate both formats
    jpeg_output = io.BytesIO()
    webp_output = io.BytesIO()

    # For JPEG (fallback format), we need RGB
    if image.mode in ("RGBA", "LA"):
        jpeg_image = Image.new("RGB", image.size, (255, 255, 255))
        jpeg_image.paste(image, mask=image.split()[-1])
        jpeg_image.save(jpeg_output, format="JPEG", quality=85, optimize=True)
    else:
        image.save(jpeg_output, format="JPEG", quality=85, optimize=True)

    # For WebP, we can keep transparency
    image.save(
        webp_output,
        format="WebP",
        quality=80,
        method=4,
        lossless=False,
    )

    return {"webp": webp_output.getvalue(), "jpeg": jpeg_output.getvalue()}


def generate_thumbnail_for_asset(name: str, file_hash: str) -> None:
    full_hash_name = get_asset_hash_subpath(file_hash)
    asset_path = ASSETS_DIR / full_hash_name

    if not asset_path.exists():
        return

    try:
        with open(asset_path, "rb") as f:
            thumbnail = create_thumbnail_from_bytes(f.read())
        if thumbnail is None:
            return
        for format, data in thumbnail.items():
            path = ASSETS_DIR / Path(f"{full_hash_name}.thumb.{format}")

            with open(path, "wb") as f:
                f.write(data)
    except Image.DecompressionBombError:
        print()
        print(f"Thumbnail generation failed for {name}: The asset is too large")
    except Exception as e:
        print()
        print(f"Thumbnail generation failed for {name}: {e}")
