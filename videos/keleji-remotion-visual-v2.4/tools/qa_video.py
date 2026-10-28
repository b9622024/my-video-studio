"""Validate delivered MP4 and compare decoded keyframes against direct Remotion stills."""
from pathlib import Path
import subprocess
import json
import hashlib
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parents[1]
video=root/'out/milk-pour-4s-1080x1920.mp4'
meta=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(video)]))
s=next(x for x in meta['streams'] if x['codec_type']=='video')
assert (s['width'],s['height'],s['r_frame_rate'],int(s['nb_frames']))==(1080,1920,'30/1',120)
assert s['codec_name']=='h264' and abs(float(meta['format']['duration'])-4)<1e-6
assert not any(x['codec_type']=='audio' for x in meta['streams'])
subprocess.run(['ffmpeg','-v','error','-i',str(video),'-f','null','-'],check=True,capture_output=True)
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(video),'-vf','scale=108:192,format=gray','-f','rawvideo','-pix_fmt','gray','-'])
frames=np.frombuffer(raw,dtype=np.uint8).reshape(-1,192,108)
assert len(frames)==120
means=frames.mean(axis=(1,2));mad=np.mean(np.abs(np.diff(frames.astype(float),axis=0)),axis=(1,2))
assert np.all(means>20)
comparisons=[]
for i,n in enumerate([0,26,44,65,90,119],1):
 direct=np.array(Image.open(root/f'out/frame-{n:03d}.png').convert('RGB')).astype(float)
 decoded=np.array(Image.open(root/f'out/decoded/frame-{i:02d}.png').convert('RGB')).astype(float)
 error=float(np.mean(np.abs(direct-decoded)))
 assert error<5, (n,error)
 comparisons.append({'frame':n,'mean_absolute_RGB_error_0_255':error})
seek_a=np.array(Image.open(root/'out/seek-reference-065.png').convert('RGB')).astype(int)
seek_b=np.array(Image.open(root/'out/seek-065.png').convert('RGB')).astype(int)
seek_delta=np.abs(seek_a-seek_b)
assert seek_delta.max()<=1 and seek_delta.mean()<.001
seek=json.loads((root/'out/seek-check.json').read_text())
seek.update({'max_RGB_delta':int(seek_delta.max()),'mean_RGB_delta':float(seek_delta.mean()),'pixel_tolerance_pass':True})
report={'video':{'width':1080,'height':1920,'fps':30,'frames':120,'seconds':4,'codec':'h264','actual_pixel_format':s['pix_fmt'],'audio_tracks':0,'bytes':video.stat().st_size,'sha256':hashlib.sha256(video.read_bytes()).hexdigest()},'all_120_frames_decoded':True,'black_frame_test_pass':True,'minimum_gray_mean':float(means.min()),'max_adjacent_frame_gray_MAD_0_255':float(mad.max()),'max_change_frame':int(np.argmax(mad)+1),'keyframe_video_comparisons':comparisons,'nonsequential_seek':seek,'scope':'Pixel checks cannot replace subjective motion review; freeze holds at start/end are intentional.'}
(root/'docs/qa-metrics.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
