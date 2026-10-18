# Theme image optimization

**Original size measured from Git tree:** 42 JPEG images, 19,456,189 bytes (~19.46 MB), excluding fonts/logo.

The workflow .github/workflows/wordpress-images.yml triggers from branch wordpress.
It installs Pillow and runs wordpress/tools/optimize_images.py:
- Uses progressive optimized JPEG, strips photo metadata, rescales long edge to 1300px (1700px for hero images).
- Uses quality 68 on cards, 75 on hero candidates.
- Preserves filenames, paths and WordPress theme references.
- Uses a temporary candidate, retaining the original if conversion would grow its size.
- Never edits public/images in the original Next.js app.
- The GitHub Actions job commits optimized binary JPEGs to the wordpress branch via GITHUB_TOKEN (contents: write).

For local rerun: python -m pip install Pillow; python wordpress/tools/optimize_images.py

The workflow must run and succeed before claiming the reduction was applied. GitHub Actions repository settings may prevent bots from pushing; if that happens, optimize locally and push images manually. Confirm the new Git tree sizes after the workflow completes.
