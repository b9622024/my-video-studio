"""Restore licensed footage from its official CDN; never upload original stock to Git."""
from pathlib import Path
import urllib.request,hashlib,subprocess,tempfile
ROOT=Path(__file__).resolve().parents[1]
URL='https://videos.pexels.com/video-files/6535488/6535488-uhd_2160_4096_30fps.mp4'
EXPECTED='1c6f5c78faec5eae03114b9afbf0e554fc944e17a0de169e79c81acb50b56037'
def main():
 target=ROOT/'public/assets/pexels-6535488-4to8-30fps.mp4'
 if target.exists(): print('Already present; preserve existing footage:',target);return
 # Uses inherited proxies/CA. In Codex obtain official network permission for this command.
 with tempfile.TemporaryDirectory() as d:
  source=Path(d)/'pexels-6535488.mp4'
  with urllib.request.urlopen(URL) as response: source.write_bytes(response.read())
  digest=hashlib.sha256(source.read_bytes()).hexdigest()
  if digest!=EXPECTED: raise RuntimeError('Official source hash changed; review source before using it: '+digest)
  subprocess.run(['ffmpeg','-v','error','-ss','4','-i',str(source),'-t','4','-an','-vf','fps=30,scale=1080:2048:flags=lanczos','-c:v','libx264','-preset','medium','-crf','16','-pix_fmt','yuv420p','-movflags','+faststart','-n',str(target)],check=True)
 print('Restored licensed trim:',target)
if __name__=='__main__': main()
