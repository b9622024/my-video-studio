"""Create private A0/A1/A2 controlled requests from the real V2.6 A request."""
import argparse
import copy
import hashlib
import json
from pathlib import Path
import wave


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda: f.read(1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--baseline', required=True, type=Path)
    p.add_argument('--output-root', required=True, type=Path)
    p.add_argument('--new-reference', required=True, type=Path)
    p.add_argument('--new-transcript', required=True, type=Path)
    p.add_argument('--pause-policy', choices=['punctuation', 'sentence_split'], default='punctuation')
    p.add_argument('--reference-review', choices=['human_confirmed', 'ASR_supported_pending_human'], required=True)
    a = p.parse_args()
    base = json.loads(a.baseline.read_text())
    if sha(Path(base['inputs']['ref_audio_path'])) != base['reference_sha256']:
        raise ValueError('Baseline reference identity changed')
    transcript = a.new_transcript.read_text().strip()
    if not transcript:
        raise ValueError('Reference transcript is empty')
    with wave.open(str(a.new_reference)) as w:
        duration = w.getnframes() / w.getframerate()
    if not 7 <= duration <= 9:
        raise ValueError('New reference must be 7-9 seconds')
    for label in ['A0', 'A1', 'A2']:
        if (a.output_root / label).exists():
            raise FileExistsError('Refuse to overwrite an existing trial')
    a.output_root.mkdir(parents=True, exist_ok=True)
    for label in ['A0', 'A1', 'A2']:
        v = copy.deepcopy(base)
        v.update({'experiment_version': '2.7', 'experiment_label': label,
                  'baseline_request_sha256': sha(a.baseline)})
        if label == 'A1':
            if a.pause_policy == 'sentence_split':
                v['inputs'].update({'text_split_method': 'cut3', 'fragment_interval': 0.22})
                v['controlled_change'] = 'Sentence/pause policy only: cut0->cut3, interval .3->.22; target unchanged.'
            else:
                v['inputs']['text'] = v['inputs']['text'].replace('老師，', '老師。').replace('今天我們', '今天，我們')
                v['controlled_change'] = 'Only punctuation; all numerical, model, seed and cut0 settings identical to A0.'
                if v['inputs']['text'] == base['inputs']['text']:
                    raise ValueError('No matching punctuation edit for this target')
        elif label == 'A2':
            v['inputs'].update({'ref_audio_path': str(a.new_reference.resolve()), 'prompt_text': transcript})
            v['reference_sha256'] = sha(a.new_reference)
            v['reference_review'] = a.reference_review
            v['controlled_change'] = 'Only reference audio and its matching transcript; all A0 target/sampling/pause settings unchanged.'
        else:
            v['controlled_change'] = 'Exact V2.6 accepted A input and model settings, including stored fixed seed.'
        directory = a.output_root / label
        directory.mkdir(mode=0o700)
        with (directory / 'request.json').open('x') as f:
            json.dump(v, f, ensure_ascii=False, indent=2)
        (directory / 'request.json').chmod(0o600)
    print('Three private requests written. Accent and similarity remain human listening judgments.')


if __name__ == '__main__':
    main()
