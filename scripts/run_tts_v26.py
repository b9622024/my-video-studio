"""Run one private classic-v2 request against a separately installed pinned upstream."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import resource
import sys
import time


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for b in iter(lambda: f.read(1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()


def main():
    start = time.perf_counter()
    p = argparse.ArgumentParser()
    p.add_argument('--upstream', type=Path, required=True)
    p.add_argument('--request', type=Path, required=True)
    a = p.parse_args()
    upstream = a.upstream.resolve()
    request = json.loads(a.request.read_text())
    run_dir = a.request.resolve().parent
    output = run_dir / 'output.wav'
    if output.exists():
        raise FileExistsError('Refuse to overwrite an existing generated voice')
    for key in ['OMP_NUM_THREADS', 'MKL_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'NUMBA_NUM_THREADS']:
        os.environ[key] = '2'
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    os.environ['TOKENIZERS_PARALLELISM'] = 'false'
    os.environ['MPLCONFIGDIR'] = str(run_dir / 'mpl-cache')
    os.environ['NUMBA_CACHE_DIR'] = str(run_dir / 'numba-cache')
    os.environ['version'] = 'v2'
    os.chdir(upstream)
    sys.path.insert(0, str(upstream))
    sys.path.insert(0, str(upstream / 'GPT_SoVITS'))
    if sha(request['inputs']['ref_audio_path']) != request['reference_sha256']:
        raise ValueError('Reference identity changed')
    for asset in request['verified_model_assets']:
        if sha(asset['local_path']) != asset['actual_sha256']:
            raise ValueError('Model identity changed')
    import torch
    torch.set_num_threads(2)
    torch.set_num_interop_threads(1)
    if torch.version.cuda is not None:
        raise RuntimeError('CPU-only torch required')
    import numpy as np
    import soundfile as sf
    from TTS_infer_pack.TTS import TTS, TTS_Config
    config = TTS_Config({'custom': request['model_config']})
    for key in ['t2s_weights_path', 'vits_weights_path', 'bert_base_path', 'cnhuhbert_base_path']:
        if str(getattr(config, key)) != request['model_config'][key]:
            raise ValueError('Unexpected model fallback: ' + key)
    load_start = time.perf_counter()
    pipeline = TTS(config)
    loaded_at = time.perf_counter()
    assert pipeline.configs.version == 'v2'
    print('ACTUAL_MODEL_CONFIG', pipeline.configs, flush=True)
    print('REFERENCE_SHA256', request['reference_sha256'], flush=True)
    infer_start = time.perf_counter()
    chunks = list(pipeline.run(request['inputs']))
    infer_seconds = time.perf_counter() - infer_start
    if not chunks:
        raise RuntimeError('No generated audio returned')
    rates = {sr for sr, _ in chunks}
    if len(rates) != 1:
        raise RuntimeError('Unexpected mixed sample rates')
    sr = chunks[0][0]
    audio = np.concatenate([data for _, data in chunks])
    if audio.size == 0 or not np.isfinite(audio).all() or not np.any(audio):
        raise RuntimeError('Invalid or empty generated audio')
    sf.write(str(output), audio, sr, subtype='PCM_16')
    report = {'status': 'generated', 'upstream_commit': request['upstream_commit'],
              'actual_model_config': request['model_config'], 'reference_sha256': request['reference_sha256'],
              'model_load_seconds': loaded_at-load_start, 'inference_seconds': infer_seconds,
              'process_seconds': time.perf_counter()-start, 'peak_main_process_rss_kib': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
              'cpu_user_seconds': resource.getrusage(resource.RUSAGE_SELF).ru_utime,
              'cpu_system_seconds': resource.getrusage(resource.RUSAGE_SELF).ru_stime,
              'output_sample_rate': sr, 'output_duration_seconds': len(audio)/sr,
              'output_sha256': sha(output), 'output_bytes': output.stat().st_size,
              'peak_amplitude_pcm': float(np.max(np.abs(audio.astype(np.float64)))),
              'parameters': request['inputs'], 'torch_version': torch.__version__, 'cuda': torch.version.cuda}
    (run_dir / 'result.json').write_text(json.dumps(report, ensure_ascii=False, indent=2))
    print('RESULT', json.dumps({k:v for k,v in report.items() if k not in ['parameters', 'actual_model_config']}, ensure_ascii=False), flush=True)


if __name__ == '__main__':
    main()
