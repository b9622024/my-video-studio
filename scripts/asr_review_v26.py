"""Optional offline ASR evidence; output is a private draft, never human verification."""
import argparse
import hashlib
import json
from pathlib import Path
from faster_whisper import WhisperModel


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--model', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('inputs', nargs='+', type=Path)
    a = p.parse_args()
    model = WhisperModel(str(a.model), device='cpu', compute_type='int8', cpu_threads=2, num_workers=1)
    results = {'human_verified': False, 'initial_prompt': None, 'files': []}
    for path in a.inputs:
        segments, info = model.transcribe(str(path), language='zh', beam_size=5, vad_filter=False,
                                         word_timestamps=True, condition_on_previous_text=False)
        rows = [{'start': float(s.start), 'end': float(s.end), 'text': s.text,
                 'avg_logprob': s.avg_logprob,
                 'words': [{'start': float(w.start), 'end': float(w.end), 'word': w.word,
                            'probability': w.probability} for w in (s.words or [])]} for s in segments]
        results['files'].append({'path': str(path), 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                                 'segments': rows})
        print(path.name, [(s['start'], s['end'], s['text']) for s in rows], flush=True)
        a.output.write_text(json.dumps(results, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
