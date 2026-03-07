import io
import warnings

from PIL import Image

from .storage import get_storage

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


async def generate_thumbnail_for_asset(file_hash: str) -> None:
    storage = get_storage()

    if not await storage.exists(file_hash):
        return

    try:
        data = await storage.retrieve(file_hash)
        thumbnails = create_thumbnail_from_bytes(data)
        if thumbnails is None:
            return
        for fmt, thumb_data in thumbnails.items():
            await storage.store(file_hash, thumb_data, suffix=f".thumb.{fmt}")
    except Image.DecompressionBombError:
        print()
        print(f"Thumbnail generation failed for {file_hash}: The asset is too large")
    except Exception as e:
        print()
        print(f"Thumbnail generation failed for {file_hash}: {e}")


def generate_thumbnail_for_asset_sync(file_hash: str) -> None:
    """Sync version for use in thread-executor contexts (save migrations)."""
    storage = get_storage()

    if not storage.exists_sync(file_hash):
        return

    try:
        data = storage.retrieve_sync(file_hash)
        thumbnails = create_thumbnail_from_bytes(data)
        if thumbnails is None:
            return
        for fmt, thumb_data in thumbnails.items():
            storage.store_sync(file_hash, thumb_data, suffix=f".thumb.{fmt}")
    except Image.DecompressionBombError:
        print()
        print(f"Thumbnail generation failed for {file_hash}: The asset is too large")
    except Exception as e:
        print()
        print(f"Thumbnail generation failed for {file_hash}: {e}")
