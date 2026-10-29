// Pure frame-time model. Huashu-informed event rhythm; Remotion rendering only.
export const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export const ease=(a:number,b:number,f:number)=>{const t=clamp((f-a)/(b-a));return t*t*t*(t*(t*6-15)+10)};
export const emission=(f:number)=>ease(11,14,f)*(1-ease(54,62,f));
export const travelFrames=9;
export const arrival=(f:number)=>emission(f-travelFrames)**2;
function integrated(f:number){let sum=0;const end=Math.max(0,Math.min(72,f));for(let a=0;a<end;a+=.05){const b=Math.min(end,a+.05);sum+=(arrival(a)+arrival(b))*(b-a)/2;}return sum;}
const total=integrated(72);
export function motionAt(frame:number){const f=Math.max(0,Math.min(89,frame)),p=clamp(integrated(f)/total),settle=Math.sin((f-72)*.62)*Math.exp(-Math.max(0,f-72)/6)*(1-ease(85,89,f));return{frame:f,p,surface:1260-610*p,angle:-12*(1-ease(0,11,f))-12*ease(54,71,f),source:emission(f),incoming:arrival(f),ripple:arrival(f)+.18*ease(63,72,f)*(1-ease(72,89,f)),surfaceRy:125+(f>=72?3*settle:0)};}
// A single continuous ribbon: local width reflects when this portion left the spout.
// No whole-stream fade or whole-stream shrinking at shut-off.
export function ribbonAt(frame:number,surface:number,widthScale=1,xOffset=0){
 const pts:Array<{x:number;y:number;w:number;nx:number;ny:number}>=[];
 for(let i=0;i<=140;i++){const q=i/140,u=1-q;
 const x=u*u*u*540+3*u*u*q*470+3*u*q*q*407+q*q*q*351;
 const y=u*u*u*365+3*u*u*q*427+3*u*q*q*582+q*q*q*surface;
 const dx=3*u*u*(470-540)+6*u*q*(407-470)+3*q*q*(351-407);
 const dy=3*u*u*(427-365)+6*u*q*(582-427)+3*q*q*(surface-582),len=Math.hypot(dx,dy);
 const w=46*widthScale*emission(frame-travelFrames*q);
 if(w>.005)pts.push({x:x+xOffset,y,w,nx:dy/len,ny:-dx/len});
 }
 if(pts.length<2)return '';
 const side=(p:typeof pts[number],s:number)=>`${(p.x+s*p.nx*p.w/2).toFixed(4)},${(p.y+s*p.ny*p.w/2).toFixed(4)}`;
 return 'M'+pts.map(p=>side(p,1)).join(' L')+' L'+[...pts].reverse().map(p=>side(p,-1)).join(' L')+'Z';
}
