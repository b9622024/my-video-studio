"""Write a NEW private request after restoring to different filesystem locations."""
import argparse
import json
from pathlib import Path


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--input', type=Path, required=True)
    p.add_argument('--output', type=Path, required=True)
    p.add_argument('--upstream', type=Path, required=True)
    p.add_argument('--private-root', type=Path, required=True)
    a = p.parse_args()
    data = json.loads(a.input.read_text())
    old_upstream = '/workspace/voice-runtime/GPT-SoVITS-' + data['upstream_commit'] + '/'
    def remap(value):
        if value.startswith(old_upstream):
            return str(a.upstream.resolve() / value[len(old_upstream):])
        if value.startswith('/workspace/voice-private/'):
            return str(a.private_root.resolve() / value[len('/workspace/voice-private/'):])
        return value
    data['model_config'] = {k: remap(v) if isinstance(v, str) else v for k, v in data['model_config'].items()}
    data['inputs']['ref_audio_path'] = remap(data['inputs']['ref_audio_path'])
    data['verified_model_assets'] = [{**x, 'local_path': remap(x['local_path'])} for x in data['verified_model_assets']]
    data['restored_from'] = str(a.input)
    a.output.parent.mkdir(parents=True, exist_ok=True)
    with a.output.open('x') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    a.output.chmod(0o600)
    print('New private request written; hashes will be checked by run_tts_v26.py')


if __name__ == '__main__':
    main()
