"""Extract reproducible reference frames from the public-domain LOC film."""
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT / "data/historical-sf/references"
PUBLIC = ROOT / "public/historical-sf/references"
PUBLIC.mkdir(parents=True, exist_ok=True)
film = RAW / "market-street-1906.mp4"
source = {
    "id": "loc-market-film",
    "title": "A trip down Market Street before the fire",
    "publisher": "Library of Congress",
    "creator": "Miles Brothers",
    "date": "1906-04-14",
    "pageUrl": "https://www.loc.gov/item/00694408/",
    "downloadUrl": "https://tile.loc.gov/storage-services/service/mbrs/ntscrm/00015143/00015143.mp4",
    "rights": "Public domain; LOC collection explicitly free to use and reuse",
    "rightsUrl": "https://www.loc.gov/item/00694408/#rights-and-access",
    "accessedAt": "2026-10-09",
    "sha256": hashlib.sha256(film.read_bytes()).hexdigest(),
    "rawLocalPath": str(film.relative_to(ROOT)),
    "notes": "Original silent archival footage, not AI imagery. Frame times are offsets into this downloaded viewing copy. Use LOC's scene-by-scene description for building identity; estimated geometry is not a survey.",
}
frames = []
times = [18, 45, 75, 110, 145, 180, 210, 240, 275, 310, 345, 380, 415, 445, 470, 490]
for t in times:
    name = f"market-film-{t:03d}.jpg"
    dest = PUBLIC / name
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", str(t), "-i", str(film), "-frames:v", "1", "-vf", "scale=1280:-1", "-q:v", "2", str(dest)], check=True)
    frames.append({"id": f"film-{t:03d}", "sourceId": source["id"], "timeSeconds": t, "path": f"/historical-sf/references/{name}", "localPath": str(dest.relative_to(ROOT)), "sha256": hashlib.sha256(dest.read_bytes()).hexdigest(), "title": f"Market Street film — viewing-copy frame at {t}s", "date": source["date"], "rights": source["rights"], "pageUrl": source["pageUrl"], "derivative": "Frame extracted and resized from original film; no generative editing"})
ledger_path = ROOT / "data/historical-sf/sources.json"
existing = json.loads(ledger_path.read_text()) if ledger_path.exists() else {}
ledger = {
    **existing,
    "sources": [source] + [s for s in existing.get("sources", []) if s["id"] != source["id"]],
    "images": frames + [i for i in existing.get("images", []) if i.get("sourceId") != source["id"]],
}
ledger_path.write_text(json.dumps(ledger, indent=2) + "\n")
(PUBLIC / "manifest.json").write_text(json.dumps(ledger, indent=2) + "\n")
try:
    from PIL import Image, ImageDraw
    sheet = Image.new("RGB", (1280, 4 * 215), "#f3ede0")
    draw = ImageDraw.Draw(sheet)
    for i, frame in enumerate(frames):
        im = Image.open(ROOT / frame["localPath"])
        im.thumbnail((310, 182))
        x, y = (i % 4) * 320, (i // 4) * 215
        sheet.paste(im, (x, y))
        draw.text((x + 8, y + 186), f"LOC April 14 1906 | {frame['timeSeconds']}s", fill="#282018")
    sheet.save(ROOT / "artifacts/historical-sf/film-contact-sheet.jpg", quality=92)
except ImportError:
    print("Pillow unavailable: contact sheet skipped")
print(f"Prepared {len(frames)} archival frames; film hash {source['sha256']}")
