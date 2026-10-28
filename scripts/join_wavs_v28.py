"""Join complete PCM WAV paragraphs without trimming, extra silence, overlap or respeeding."""
import argparse
import hashlib
import json
from pathlib import Path
import wave


def sha(path):
    h = hashlib.sha256()
    with path.open('rb') as f:
        for b in iter(lambda: f.read(1024*1024), b''):
            h.update(b)
    return h.hexdigest()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--report', type=Path, required=True)
    p.add_argument('inputs', nargs='+', type=Path)
    a = p.parse_args()
    if a.output.exists() or a.report.exists():
        raise FileExistsError('Refuse to overwrite an existing merged delivery')
    fmt = None
    rows = []
    total_frames = 0
    for path in a.inputs:
        with wave.open(str(path)) as w:
            spec = (w.getnchannels(), w.getsampwidth(), w.getframerate(), w.getcomptype())
            if spec[3] != 'NONE':
                raise ValueError('Only uncompressed PCM WAV supported')
            if fmt is not None and fmt != spec:
                raise ValueError('Sample formats differ; no implicit resampling allowed')
            fmt = spec
            n = w.getnframes()
            rows.append({'source': str(path), 'sha256': sha(path), 'frames': n,
                         'combined_start_seconds': total_frames/spec[2],
                         'combined_end_seconds': (total_frames+n)/spec[2]})
            total_frames += n
    if not rows:
        raise ValueError('Need at least one input')
    with a.output.open('xb') as stream:
        a.output.chmod(0o600)
        with wave.open(stream, 'wb') as output:
            output.setnchannels(fmt[0])
            output.setsampwidth(fmt[1])
            output.setframerate(fmt[2])
            for path in a.inputs:
                with wave.open(str(path)) as source:
                    while data := source.readframes(32768):
                        output.writeframesraw(data)
    report = {'method': 'sample-exact concatenation of complete paragraph WAVs',
              'trimmed_frames': 0, 'added_silence_frames': 0, 'crossfade_frames': 0,
              'resampled': False, 'speed_or_pitch_changed': False,
              'sample_rate_hz': fmt[2], 'frames': total_frames,
              'duration_seconds': total_frames/fmt[2], 'segments': rows,
              'output_sha256': sha(a.output)}
    with a.report.open('x') as f:
        json.dump(report, f, ensure_ascii=False, indent=2)
    print(json.dumps({'duration_seconds': report['duration_seconds'], 'segments': rows}, indent=2))


if __name__ == '__main__':
    main()
