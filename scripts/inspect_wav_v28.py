"""Report PCM validity, full-scale samples and low-energy intervals; no speech/voice grading."""
import argparse
import json
from pathlib import Path
import wave
import numpy as np


def inspect(path):
    with wave.open(str(path)) as w:
        if w.getsampwidth() != 2 or w.getnchannels() != 1:
            raise ValueError('Expected mono PCM16')
        sr = w.getframerate()
        data = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2')
    audio = data.astype(np.float64)/32768
    nonzero = np.flatnonzero(data)
    size = int(sr*0.02)
    frames = audio[:len(audio)//size*size].reshape(-1, size)
    rms = np.sqrt(np.mean(frames*frames, axis=1))
    quiet = 20*np.log10(rms+1e-12) < -35
    intervals = []
    start = None
    for i, state in enumerate(np.append(quiet, False)):
        if state and start is None:
            start = i
        elif not state and start is not None:
            if (i-start)*0.02 >= 0.6:
                intervals.append({'start_seconds': round(start*.02, 2), 'end_seconds': round(i*.02, 2),
                                  'duration_seconds': round((i-start)*.02, 2),
                                  'touches_edge': start == 0 or i == len(quiet)})
            start = None
    return {'path': str(path), 'sample_rate_hz': sr, 'channels': 1, 'bits': 16,
            'frames': len(data), 'duration_seconds': len(data)/sr,
            'digital_full_scale_fraction': float(np.mean(np.abs(audio) >= 32767/32768)),
            'exact_zero_leading_seconds': int(nonzero[0])/sr if len(nonzero) else len(data)/sr,
            'exact_zero_trailing_seconds': (len(data)-1-int(nonzero[-1]))/sr if len(nonzero) else len(data)/sr,
            'low_energy_intervals_at_least_0_6s': intervals,
            'limitations': '20ms RMS<-35dBFS is not a phoneme boundary, distortion test or a human pause judgment.'}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('inputs', nargs='+', type=Path)
    a = p.parse_args()
    result = [inspect(x) for x in a.inputs]
    with a.output.open('x') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
