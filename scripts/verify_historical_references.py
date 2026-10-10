"""Check the preserved research library against its committed inventory."""
import hashlib,json
from pathlib import Path
from PIL import Image
repo=Path(__file__).resolve().parent.parent
root=repo/'local-only/historical-sf-references'
manifest=json.loads((repo/'data/historical-sf/reference-library.json').read_text())
images=0
for entry in manifest['files']:
    path=root/entry['path']
    assert path.is_relative_to(root),entry['path']
    assert path.stat().st_size==entry['bytes'],f'Size mismatch: {path}'
    assert hashlib.sha256(path.read_bytes()).hexdigest()==entry['sha256'],f'Hash mismatch: {path}'
    if path.suffix.lower() in {'.jpg','.jpeg','.png','.tif','.tiff'}:
        with Image.open(path) as image:image.verify()
        images+=1
print(f'Verified {len(manifest["files"])} files and decoded {images} images.')
