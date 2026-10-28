"""Download only classic v2 inference assets, pin HF revisions and verify known hashes."""
import hashlib
import json
from pathlib import Path
import sys
import urllib.parse
import urllib.request
import zipfile


def digest(path):
    h = hashlib.sha256()
    with path.open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def fetch(url, dest, size=None, expected=None):
    dest.parent.mkdir(parents=True, exist_ok=True)
    if not dest.exists():
        partial = dest.with_suffix(dest.suffix + '.partial')
        with urllib.request.urlopen(url, timeout=120) as response, partial.open('wb') as output:
            while block := response.read(1024 * 1024):
                output.write(block)
        actual = digest(partial)
        if size is not None and partial.stat().st_size != size:
            raise ValueError('Size mismatch: ' + dest.name)
        if expected and actual != expected:
            raise ValueError('SHA-256 mismatch: ' + dest.name)
        partial.rename(dest)
    actual = digest(dest)
    if expected and actual != expected:
        raise ValueError('Existing file hash mismatch: ' + dest.name)
    if size is not None and dest.stat().st_size != size:
        raise ValueError('Existing file size mismatch: ' + dest.name)
    return actual


def main():
    manifest, upstream, record = map(Path, sys.argv[1:4])
    specs = json.loads(manifest.read_text())
    revisions = {}
    for repo in sorted({a['repository'] for a in specs['assets']}):
        with urllib.request.urlopen('https://huggingface.co/api/models/' + repo, timeout=30) as response:
            revisions[repo] = json.load(response)['sha']
    results = []
    for item in specs['assets']:
        repo, path = item['repository'], item['path']
        url = 'https://huggingface.co/' + repo + '/resolve/' + revisions[repo] + '/' + urllib.parse.quote(path, safe='/')
        dest = upstream / ('model-archives' if item['role'] == 'g2pw_archive' else 'GPT_SoVITS/pretrained_models') / path
        actual = fetch(url, dest, item['bytes'], item['expected_sha256'])
        results.append({**item, 'revision': revisions[repo], 'url': url, 'local_path': str(dest), 'actual_sha256': actual, 'verified': True})
        print('VERIFIED', item['role'], dest.stat().st_size, flush=True)
    repo = 'lj1995/GPT-SoVITS'
    for path in ['chinese-roberta-wwm-ext-large/config.json', 'chinese-roberta-wwm-ext-large/tokenizer.json',
                 'chinese-hubert-base/config.json', 'chinese-hubert-base/preprocessor_config.json']:
        url = 'https://huggingface.co/' + repo + '/resolve/' + revisions[repo] + '/' + path
        dest = upstream / 'GPT_SoVITS/pretrained_models' / path
        actual = fetch(url, dest)
        results.append({'role': 'configuration', 'path': path, 'revision': revisions[repo], 'url': url,
                        'bytes': dest.stat().st_size, 'actual_sha256': actual, 'local_path': str(dest), 'verified': True})
    archive = upstream / 'model-archives/G2PWModel.zip'
    target = upstream / 'GPT_SoVITS/text'
    with zipfile.ZipFile(archive) as z:
        for entry in z.infolist():
            if not (target / entry.filename).resolve().is_relative_to(target.resolve()):
                raise ValueError('Unsafe ZIP member')
        z.extractall(target)
        members = z.namelist()
    record.parent.mkdir(parents=True, exist_ok=True)
    record.write_text(json.dumps({'upstream_commit': specs['upstream_commit'], 'hf_revisions': revisions,
                                  'assets': results, 'g2pw_members': members}, indent=2))
    print('G2PW top-level', sorted({x.split('/')[0] for x in members}), flush=True)


if __name__ == '__main__':
    main()
