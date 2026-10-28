from pathlib import Path
from PIL import Image,ImageDraw
P=Path(__file__).resolve().parents[1];O=Path('/workspace/outputs/visual-v2.5');O.mkdir(exist_ok=True)
c=Image.new('RGB',(1080,680),'#eee8df');d=ImageDraw.Draw(c)
for i,n in enumerate([30,165,330]):
 im=Image.open(P/f'out/MilkBrollV25-frame-{n:03d}.png').convert('RGB').resize((360,640),Image.Resampling.LANCZOS);c.paste(im,(i*360,40));d.text((i*360+10,12),['01 / POUR','02 / SPLIT COMPARISON','03 / STOP + PORTION'][i],fill='#183149')
c.save(O/'storyboard-material-preview.png')
