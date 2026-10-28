"""Offline private ZIP creation and verification; no upload or encryption."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import zipfile

INDEX = 'BACKUP_SHA256.json'

def sha(data):
    return hashlib.sha256(data).hexdigest()

def safe_name(name):
    path = PurePosixPath(name)
    if path.is_absolute() or '..' in path.parts or '\\' in name or not name or ':' in name:
        raise ValueError('Unsafe archive path')

def verify(archive):
    with zipfile.ZipFile(archive) as z:
        names = z.namelist()
        if len(set(names)) != len(names):
            raise ValueError('Duplicate ZIP paths')
        for name in names:
            safe_name(name)
        records = json.loads(z.read(INDEX))
        if not records or set(names) != set(records) | {INDEX}:
            raise ValueError('Manifest does not cover complete archive')
        for name, row in records.items():
            data = z.read(name)
            if len(data) != row['bytes'] or sha(data) != row['sha256']:
                raise ValueError('Checksum mismatch: ' + name)
    print(f'Verified {len(records)} files and full ZIP inventory')

def create(root, archive):
    root = root.resolve(strict=True)
    archive = archive.resolve()
    repo = Path(__file__).resolve().parents[1]
    if archive.is_relative_to(root) or archive.is_relative_to(repo):
        raise ValueError('Destination must be outside source and repository')
    paths = sorted(root.rglob('*'))
    if any(p.is_symlink() for p in paths):
        raise ValueError('Symbolic links are not allowed')
    paths = [p for p in paths if p.is_file()]
    if not paths:
        raise ValueError('Empty source')
    records = {}
    with archive.open('xb') as stream:
        archive.chmod(0o600)
        with zipfile.ZipFile(stream, 'w', compression=zipfile.ZIP_DEFLATED) as z:
            for p in paths:
                name = p.relative_to(root).as_posix()
                safe_name(name)
                if name == INDEX:
                    raise ValueError('Reserved manifest filename')
                data = p.read_bytes()
                records[name] = {'bytes': len(data), 'sha256': sha(data)}
                z.writestr(name, data)
            z.writestr(INDEX, json.dumps(records, ensure_ascii=False, indent=2))
    verify(archive)
    print('ZIP SHA-256:', sha(archive.read_bytes()))

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('action', choices=['create', 'verify'])
    p.add_argument('path', type=Path)
    p.add_argument('destination', type=Path, nargs='?')
    a = p.parse_args()
    if a.action == 'verify':
        verify(a.path)
    elif a.destination is None:
        p.error('create needs source directory and destination ZIP')
    else:
        create(a.path, a.destination)

if __name__ == '__main__':
    main()
