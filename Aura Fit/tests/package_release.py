"""Create the handoff archive from an explicit list of release files."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'Aura-Fit-v1.1-final.zip'
files = [ROOT / name for name in ['index.html','admin.html','preview.html','admin-preview.html','build.js','sw.js','manifest.webmanifest','README.md','START-HERE.md','FINAL-QA.md']]
for folder in ['css','js','icons','vendor']:
    files.extend(p for p in (ROOT/folder).rglob('*') if p.is_file())
for name in ['regression.test.js','browser_qa.py','admin_review.py','gender_flow.py','user_journey.py','release_smoke.py','package_release.py']:
    files.append(ROOT/'tests'/name)
for folder in ['final-v1.1','admin-review','gender','user-journey','release']:
    files.extend(p for p in (ROOT/'tests/artifacts'/folder).rglob('*') if p.is_file())
with ZipFile(OUT,'w',compression=ZIP_DEFLATED,compresslevel=9) as z:
    for p in sorted(set(files)):
        assert p.is_file(), p
        z.write(p, 'Aura-Fit-v1.1/' + p.relative_to(ROOT).as_posix())
with ZipFile(OUT) as z:
    assert z.testzip() is None
    for p in files:
        assert z.read('Aura-Fit-v1.1/' + p.relative_to(ROOT).as_posix()) == p.read_bytes()
print(f'{OUT}: {len(set(files))} files, {OUT.stat().st_size:,} bytes. Archive integrity and source parity verified.')
