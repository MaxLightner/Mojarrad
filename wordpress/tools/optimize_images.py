#!/usr/bin/env python3
"""Optimize only PUBLIC WordPress theme JPEG assets; preserve filenames and source originals.

Run from repository root with Pillow installed:
    python wordpress/tools/optimize_images.py
The separate Next.js public/ directory is NEVER changed.
"""
from __future__ import annotations

import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1] / "themes" / "mojarrad" / "assets" / "images"
HERO_NAMES = {"villa-z-1.jpg", "villa-1.jpg", "cons-n-1.jpg", "tower-1.jpg"}
summary = {"count": 0, "modified": 0, "bytes_before": 0, "bytes_after": 0, "items": []}

for path in sorted(ROOT.rglob("*.jpg")):
    before = path.stat().st_size
    summary["count"] += 1
    summary["bytes_before"] += before
    max_dimension = 1700 if path.name in HERO_NAMES else 1300
    quality = 75 if path.name in HERO_NAMES else 68
    candidate = path.with_name(path.name + ".optimized")
    try:
        with Image.open(path) as src:
            im = ImageOps.exif_transpose(src)
            if im.mode != "RGB":
                im = im.convert("RGB")
            im.thumbnail((max_dimension, max_dimension), Image.Resampling.LANCZOS)
            im.save(candidate, "JPEG", quality=quality, optimize=True, progressive=True, subsampling=2)
        after = candidate.stat().st_size
        if after < before:
            candidate.replace(path)
            summary["modified"] += 1
        else:
            after = before
    finally:
        candidate.unlink(missing_ok=True)
    summary["bytes_after"] += after
    summary["items"].append({"name": str(path.relative_to(ROOT)), "before": before, "after": after})

print(json.dumps(summary, ensure_ascii=False, indent=2))
print("Total: %.2f MB -> %.2f MB (%.1f%% reduction)" % (
    summary["bytes_before"] / 1e6,
    summary["bytes_after"] / 1e6,
    100 * (1 - summary["bytes_after"] / max(1, summary["bytes_before"])),
))
