"""Prepare independent private paragraphs with only target text changed from accepted A0."""
import argparse
import copy
import hashlib
import json
from pathlib import Path


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda: f.read(1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--baseline', type=Path, required=True)
    p.add_argument('--paragraphs', type=Path, required=True)
    p.add_argument('--output-root', type=Path, required=True)
    a = p.parse_args()
    base = json.loads(a.baseline.read_text())
    paragraphs = json.loads(a.paragraphs.read_text())
    if not paragraphs or any(not isinstance(t, str) or not t.strip() for t in paragraphs):
        raise ValueError('Need nonempty paragraph strings')
    for i in range(len(paragraphs)):
        if (a.output_root / f'segment-{i+1:02d}').exists():
            raise FileExistsError('Refuse to overwrite existing segment')
    if sha(Path(base['inputs']['ref_audio_path'])) != base['reference_sha256']:
        raise ValueError('Reference changed')
    for i, text in enumerate(paragraphs, 1):
        data = copy.deepcopy(base)
        data['inputs']['text'] = text
        data.update({'experiment_version': '2.8', 'segment_number': i,
                     'baseline_request_sha256': sha(a.baseline),
                     'controlled_change': 'Only target paragraph text differs from accepted V2.7 A0.'})
        directory = a.output_root / f'segment-{i:02d}'
        directory.mkdir(mode=0o700, parents=True)
        path = directory / 'request.json'
        with path.open('x') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        path.chmod(0o600)
    print(f'Prepared {len(paragraphs)} independent requests; A0 model/reference/settings retained')


if __name__ == '__main__':
    main()
