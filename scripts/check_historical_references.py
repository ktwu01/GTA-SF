"""Check the downloaded historical reference pack against its recorded ledger."""
from pathlib import Path
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ledger = json.loads((ROOT / "data/historical-sf/sources.json").read_text())
public = json.loads((ROOT / "public/historical-sf/references/manifest.json").read_text())
assert public == ledger, "Public and research source ledgers differ"
ids = set()
photo_captures = set()
frames = 0
for item in ledger["images"]:
    assert item["id"] not in ids, f"Duplicate source image: {item['id']}"
    ids.add(item["id"])
    assert item.get("rights") and item.get("pageUrl"), f"Missing provenance: {item['id']}"
    path = ROOT / item["localPath"]
    assert path.exists(), f"Missing reference: {path}"
    assert hashlib.sha256(path.read_bytes()).hexdigest() == item["sha256"], f"Changed reference: {path}"
    with Image.open(path) as im:
        assert im.width >= 400 and im.height >= 300, f"Reference too small: {path}"
        im.verify()
    if item.get("sourceId") == "loc-market-film":
        assert item["date"] == "1906-04-14"
        frames += 1
    else:
        photo_captures.add(item.get("captureId", item["id"]))
assert frames >= 12, "Insufficient route views"
assert len(photo_captures) >= 6, "Insufficient independent historical photos/postcards"
assert {"palace-1904", "palace-c1900", "call-1900", "ferry-1901", "emporium-1904", "market-1900"} <= ids
assert {"ferry-terminal-1905", "ferry-1901-hires"} <= ids, "Missing focused district references"
for excerpt in ledger.get("excerpts", []):
    path = ROOT / excerpt["localPath"]
    assert path.exists(), f"Missing archival excerpt: {path}"
    assert hashlib.sha256(path.read_bytes()).hexdigest() == excerpt["sha256"], f"Changed archival excerpt: {path}"
    assert excerpt["sourceId"] in {s["id"] for s in ledger["sources"]}
texture_manifest = ROOT / "data/historical-sf/texture-provenance.json"
textures = json.loads(texture_manifest.read_text())["textures"] if texture_manifest.exists() else []
texture_paths = set()
image_records = {item["id"]: item for item in ledger["images"]}
for texture in textures:
    assert texture["outputPath"] not in texture_paths, "Duplicate material texture record"
    texture_paths.add(texture["outputPath"])
    path = ROOT / texture["outputPath"]
    assert path.is_file(), f"Missing material texture: {path}"
    assert hashlib.sha256(path.read_bytes()).hexdigest() == texture["sha256"], f"Changed material texture: {path}"
    assert texture["sourceImageIds"], f"Missing material source: {path}"
    assert set(texture["sourceImageIds"]) <= ids, f"Unknown material source: {path}"
    assert texture["transformation"], f"Missing material transformation: {path}"
    with Image.open(path) as im:
        im.verify()
    crop = texture["transformation"].get("cropPixels")
    if crop:
        source = image_records[texture["sourceImageIds"][0]]
        with Image.open(ROOT / source["localPath"]) as im:
            left, top, right, bottom = crop
            assert 0 <= left < right <= im.width and 0 <= top < bottom <= im.height, f"Material crop outside source image: {path}"
print(json.dumps({"status": "pass", "archivalFrames": frames, "independentPhotos": len(photo_captures), "verifiedImageHashes": len(ids), "verifiedMaterialTextures": len(textures), "scope": "Files, provenance fields, distinct captures, reference coverage identities, material derivatives and image decoding; does not verify 3D fidelity."}, indent=2))
