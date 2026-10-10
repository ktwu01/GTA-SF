"""Preserve local originals and source metadata without publishing research-only images."""
import hashlib,json,shutil
from pathlib import Path
root=Path('local-only/historical-sf-references');root.mkdir(parents=True,exist_ok=True)
pack=json.loads(Path('data/historical-sf/sources.json').read_text());sources={s['id']:s for s in pack['sources']}
lookup={}
for s in pack['sources']:
 if s.get('rawLocalPath'):lookup[s['rawLocalPath']]={**s,'sourceId':s['id']}
for s in pack['images']:
 if s.get('localPath'):lookup[s['localPath']]={**sources.get(s.get('sourceId',''),{}),**s}
extra={
 'thayer-1905.jpg':('https://www.nps.gov/features/safr/feat0001/virtualships/thayermore/a0000053.jpg','Thayer historical photograph; exact exposure date unknown'),
 'sadie-lumber.jpg':('https://www.nps.gov/features/safr/feat0001/virtualships/thayermore/a0000049.jpg','Near-sister Sadie under sail; exposure date unknown'),
 'thayer-lumber.jpg':('https://www.nps.gov/features/safr/feat0001/virtualships/thayermore/a0000054.jpg','Thayer lumber service; exposure date unknown'),
 'east-street-report.pdf':('https://tile.loc.gov/storage-services/master/pnp/habshaer/ca/ca0800/ca0859/data/ca0859data.pdf','HAER CA5; historic East Street image PDFp20/printedp19, circa1900'),
 'east-street-ca1900.png':('https://tile.loc.gov/storage-services/master/pnp/habshaer/ca/ca0800/ca0859/data/ca0859data.pdf','Rendered PDFp20/printedp19; derived local image'),
}
for n in ['SanbornSF5_6','SanbornSF5_6detail','SanbornSFkey']:extra[n+'.jpg']=('https://rumsey3.s3.amazonaws.com/images/SFSanborn/'+n+'.jpg','Rumsey/SFPL Sanborn preview;1899/1900 revised through1905; full viewer access challenge')
for name,(url,notes) in extra.items():lookup['artifacts/historical-sf/research/'+name]={'downloadUrl':url,'notes':notes,'rights':'Research-only copy. Not a runtime redistribution permission.','dateConfidence':'unknown exact exposure date' if 'unknown' in notes else 'caption/catalogue','pageUrl':'https://www.nps.gov/features/safr/feat0001/virtualships/thayermoreinfo.htm' if 'thayer' in url else url}
files=[]
for folder in ['public/historical-sf/references','artifacts/historical-sf/research','data/historical-sf/references','data/historical-sf/snapshots']:
 for source in sorted(Path(folder).rglob('*')):
  if not source.is_file():continue
  target=root/source;target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,target)
  metadata=lookup.get(str(source),{'notes':'Existing local reference; see accompanying source ledgers for attribution.','rights':'Unresolved; research only'})
  files.append({'path':str(target.relative_to(root)),'originalLocalPath':str(source),'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'metadata':metadata})
for name in ['sources.json','texture-provenance.json','buildings.json']:
 shutil.copy2(Path('data/historical-sf')/name,root/name)
manifest={'retrievedAt':'2026-10-09','purpose':'Local historical modeling research. Not served by Vite or included in production.','files':files}
(root/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
Path('data/historical-sf/reference-library.json').write_text(json.dumps(manifest,indent=2)+'\n')
(root/'INDEX.md').write_text('# Historical SF reference library\n\nRead manifest.json for local paths, source URLs, locators, rights and hashes.\nRead buildings.json for each building fact and its source.\nRead sources.json and texture-provenance.json for the existing archival imagery.\nSanborn previews are not measured survey data.\nThis directory is local-only and excluded from Git and Vite serving.\n')
print(f'Preserved {len(files)} files, {sum(f["bytes"] for f in files):,} bytes in {root}')
