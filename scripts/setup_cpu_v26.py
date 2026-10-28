"""Rebuild isolated CPU-only classic v2; run with platform-authorized network access."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import urllib.request
import zipfile


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda: f.read(1024*1024), b''):
            h.update(b)
    return h.hexdigest()


def download(url, dest, expected, size=None):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        partial = dest.with_suffix(dest.suffix+'.partial')
        with urllib.request.urlopen(url, timeout=120) as src, partial.open('wb') as out:
            while data := src.read(1024*1024):
                out.write(data)
        if sha(partial) != expected or (size is not None and partial.stat().st_size != size):
            raise ValueError('Downloaded asset identity mismatch: '+dest.name)
        partial.rename(dest)
    if sha(dest) != expected or (size is not None and dest.stat().st_size != size):
        raise ValueError('Existing asset identity mismatch: '+dest.name)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--runtime', type=Path, required=True)
    a = p.parse_args()
    repo = Path(__file__).resolve().parents[1]
    root = a.runtime.resolve()
    if root.is_relative_to(repo):
        p.error('Keep runtime, weights and logs outside the public code repository')
    root.mkdir(parents=True, exist_ok=True)
    if shutil.disk_usage(root).free < 10*1024**3:
        raise RuntimeError('Require 10 GiB free preparation budget before setup')
    lock = json.loads((repo/'config/model-assets.v2.6.lock.json').read_text())
    commands = root/'setup-commands.jsonl'
    env = os.environ.copy()
    env.update({'CC':'/usr/bin/gcc', 'CXX':'/usr/bin/g++'})
    # Proxy, CA trust and platform authentication environment are inherited unchanged.
    def run(cmd):
        with commands.open('a') as f:
            f.write(json.dumps(cmd)+'\n')
        subprocess.run(cmd, env=env, check=True)
    source = root/'upstream.tar.gz'
    download(lock['source_url'], source, lock['source_sha256'])
    upstream = root/('GPT-SoVITS-'+lock['upstream_commit'])
    if not (upstream/'GPT_SoVITS/TTS_infer_pack/TTS.py').exists():
        with tarfile.open(source) as t:
            t.extractall(root, filter='data')
    venv = root/'venv'
    if not venv.exists():
        run([sys.executable, '-m', 'venv', str(venv)])
    python = str(venv/'bin/python')
    run([python,'-m','pip','install','--no-cache-dir','torch==2.6.0','torchaudio==2.6.0',
         '--index-url','https://download.pytorch.org/whl/cpu'])
    run([python,'-m','pip','install','--no-cache-dir','-r',str(repo/'config/requirements-cpu.v2.6.lock.txt')])
    run([python,'-m','pip','check'])
    for row in lock['assets']:
        dest = upstream/row['path']
        if not dest.resolve().is_relative_to(upstream.resolve()):
            raise ValueError('Unsafe asset path')
        download(row['url'], dest, row['sha256'], row['bytes'])
    target = upstream/lock['extract_g2pw_to']
    if not (target/'G2PWModel').exists():
        with zipfile.ZipFile(upstream/lock['extract_g2pw_from']) as z:
            if any(not (target/n).resolve().is_relative_to(target.resolve()) for n in z.namelist()):
                raise ValueError('Unsafe G2PW archive')
            z.extractall(target)
    (root/'UPSTREAM_COMMIT').write_text(lock['upstream_commit']+'\n')
    print('Installed isolated runtime. Restore PRIVATE requests and audio outside Git before inference.')


if __name__ == '__main__':
    main()
