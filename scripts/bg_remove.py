"""Remove background from /imgs/*.jpeg and write {flower}.png with transparency.

Strategy:
- The source illustrations sit on solid BLACK backgrounds. ML segmentation
  (rembg / U-Net) tends to wrongly drop white petals and thin green stems
  on such inputs.
- We use a fast, accurate luminance/chroma-based key: any pixel close to
  pure black becomes transparent with a soft falloff; everything else stays
  fully opaque. Edge pixels are then color-corrected by un-premultiplying
  the residual black contamination, eliminating the dark halo.
- Output PNG dimensions match the source 1:1 — perfect alignment.
"""

from pathlib import Path

import numpy as np
from PIL import Image

IMGS = Path(__file__).resolve().parent.parent / "imgs"

FLOWERS = ["rose", "tulip", "sunflower", "daisy", "lily", "orchid"]

# Luminance thresholds: pixels below LO are fully transparent, above HI fully
# opaque, in-between get a smooth alpha. Tuned to keep dark-green stems
# (luminance ~70-110) fully opaque while killing the near-black background.
LO = 12
HI = 38


def remove_black_background(im: Image.Image) -> Image.Image:
    rgb = np.asarray(im.convert("RGB"), dtype=np.float32)
    # Perceptual luminance
    lum = 0.299 * rgb[..., 0] + 0.587 * rgb[..., 1] + 0.114 * rgb[..., 2]

    alpha = np.clip((lum - LO) * (255.0 / (HI - LO)), 0.0, 255.0)

    # Un-premultiply: source pixel = fg * (a/255) + black * (1 - a/255)
    # So fg = src / (a/255). Avoid divide-by-zero for transparent pixels.
    a_norm = np.clip(alpha / 255.0, 1e-6, 1.0)[..., None]
    fg = np.clip(rgb / a_norm, 0, 255)

    out = np.concatenate([fg, alpha[..., None]], axis=-1).astype(np.uint8)
    # Fully transparent pixels: zero out RGB to keep PNG clean
    transparent = alpha < 1
    out[transparent] = 0
    return Image.fromarray(out, mode="RGBA")


def process(name: str) -> None:
    src = IMGS / f"{name}.jpeg"
    if not src.exists():
        print(f"  skip (missing): {src}")
        return
    out_path = IMGS / f"{name}.png"
    with Image.open(src) as im:
        result = remove_black_background(im)
        result.save(out_path, format="PNG", optimize=True)
    print(f"  wrote: {out_path.name} ({out_path.stat().st_size // 1024} KB)")


def main() -> None:
    print(f"Background removal -> {IMGS}")
    for f in FLOWERS:
        process(f)
    print("Done.")


if __name__ == "__main__":
    main()
