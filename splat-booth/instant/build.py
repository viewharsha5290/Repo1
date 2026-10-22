#!/usr/bin/env python3
"""Package Splat Booth as a Facebook Instant Games bundle.

Reads ../index.html (the same game that runs in any browser), swaps the
Google Fonts link for the bundled fonts, adds the Instant Games SDK and
writes dist/ plus splat-booth-instant.zip ready to upload.

Usage: python3 splat-booth/instant/build.py
"""
import json, re, shutil, zipfile
from pathlib import Path

SDK = "https://connect.facebook.net/en_US/fbinstant.8.0.js"
here = Path(__file__).resolve().parent
dist = here / "dist"
zip_path = here / "splat-booth-instant.zip"

html = (here.parent / "index.html").read_text()

# Use the bundled fonts instead of loading them from Google.
html, n = re.subn(r'<link rel="(?:preconnect|stylesheet)" href="https://fonts\.(?:googleapis|gstatic)\.com[^"]*"[^>]*>\n?', "", html)
assert n >= 1, "Google Fonts link not found in index.html"
html = html.replace("</title>", '</title>\n<link rel="stylesheet" href="fonts/fonts.css">', 1)

# The SDK must load before the game script runs.
html = "<!doctype html>\n<html lang=\"en\">\n" + html.replace(
    "</title>", f'</title>\n<script src="{SDK}"></script>', 1)

json.loads((here / "fbapp-config.json").read_text())  # fail early on bad JSON

shutil.rmtree(dist, ignore_errors=True)
(dist / "fonts").mkdir(parents=True)
(dist / "index.html").write_text(html)
shutil.copy(here / "fbapp-config.json", dist)
for f in (here / "fonts").iterdir():
    shutil.copy(f, dist / "fonts")

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
    for f in sorted(dist.rglob("*")):
        if f.is_file():
            z.write(f, f.relative_to(dist).as_posix())

print(f"Wrote {zip_path.name} ({zip_path.stat().st_size // 1024} KB):")
for name in zipfile.ZipFile(zip_path).namelist():
    print("  " + name)
