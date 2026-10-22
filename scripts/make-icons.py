"""Builds the PWA icons and web logo from the Cool Hub logo.

Usage: python3 scripts/make-icons.py scripts/assets/logo-source.jpg   (needs Pillow)
"""
import sys
from PIL import Image, ImageDraw

src = Image.open(sys.argv[1] if len(sys.argv) > 1 else "scripts/assets/logo-source.jpg").convert("RGB")


def tile(size, inset, rounded):
    """White tile with the logo centred; `inset` is the margin as a fraction of the size."""
    canvas = Image.new("RGBA", (size, size), (255, 255, 255, 255))
    inner = int(size * (1 - 2 * inset))
    logo = src.resize((inner, inner), Image.LANCZOS)
    canvas.paste(logo, ((size - inner) // 2, (size - inner) // 2))
    if rounded:
        mask = Image.new("L", (size * 4, size * 4), 0)
        ImageDraw.Draw(mask).rounded_rectangle((0, 0, size * 4 - 1, size * 4 - 1), radius=int(size * 4 * 0.22), fill=255)
        canvas.putalpha(mask.resize((size, size), Image.LANCZOS))
    return canvas


tile(192, 0.04, True).save("public/icons/icon-192.png")
tile(512, 0.04, True).save("public/icons/icon-512.png")
tile(512, 0.15, False).save("public/icons/maskable-512.png")  # inside the 80% safe zone
tile(180, 0.06, False).save("public/icons/apple-touch-icon.png")
src.resize((640, 640), Image.LANCZOS).save("public/logo.jpg", quality=90)
# favicon: PNG-in-ICO
tile(64, 0.02, True).save("app/favicon.ico", format="ICO", sizes=[(64, 64)])
print("icons written")

# Watermark silhouette (used as a CSS mask): darkness of the logo becomes alpha.
from PIL import ImageOps

gray = ImageOps.invert(src.convert("L")).point(lambda v: 0 if v < 24 else min(255, int(v * 1.25)))
wm = Image.new("RGBA", src.size, (0, 0, 0, 0))
wm.putalpha(gray)
wm.resize((800, 800), Image.LANCZOS).save("public/watermark.png", optimize=True)
