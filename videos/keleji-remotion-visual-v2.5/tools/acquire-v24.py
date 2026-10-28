"""Restore project footage using official Pexels CDN and inherited proxy/CA."""
from pathlib import Path
import hashlib,json,tempfile,urllib.request,subprocess
P=Path(__file__).resolve().parents[1]
def main():
 target=P/'public/assets/pexels-6535488-v24-12s.mp4'
 if target.exists():print('Preserving existing V2.4 working footage');return
 asset=next(a for a in json.loads((P/'docs/asset-manifest.json').read_text())['assets'] if a['path'].endswith('v24-12s.mp4'))
 with tempfile.TemporaryDirectory() as d:
  source=Path(d)/'pexels-6535488.mp4'
  with urllib.request.urlopen(asset['official_cdn']) as response:source.write_bytes(response.read())
  assert hashlib.sha256(source.read_bytes()).hexdigest()==asset['source_sha256'],'Source changed; review before using'
  subprocess.run(['ffmpeg','-v','error','-ss','4','-i',str(source),'-an','-vf','fps=30,scale=1080:2048:flags=lanczos,tpad=stop_mode=clone:stop_duration=1','-t','12','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart','-n',str(target)],check=True)
 print('Restored 12s working trim; review derived hash if FFmpeg version differs.')
if __name__=='__main__':main()
