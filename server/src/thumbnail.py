import io
import warnings

from PIL import Image

warnings.simplefilter("ignore", Image.DecompressionBombWarning)


def create_thumbnail(input_bytes, max_size=(200, 200)):
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
