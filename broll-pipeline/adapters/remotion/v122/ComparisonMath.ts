export type CameraKey={frame:number;x:number;y:number;zoom:number};
export const smoother=(t:number)=>{const p=Math.max(0,Math.min(1,t));return p*p*p*(p*(p*6-15)+10);};
export function cameraAt(frame:number,keys:CameraKey[]):Omit<CameraKey,'frame'>{
 if(frame<=keys[0].frame)return keys[0];
 for(let i=1;i<keys.length;i++){const a=keys[i-1],b=keys[i];if(frame<=b.frame){const t=smoother((frame-a.frame)/(b.frame-a.frame));return{x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,zoom:a.zoom+(b.zoom-a.zoom)*t};}}
 return keys[keys.length-1];
}
export const stateIndexAt=(frame:number,count:number,hold:number)=>Math.min(count-1,Math.max(0,Math.floor(frame/hold)));
export function labelFits(center:number[],cam:Omit<CameraKey,'frame'>,size:number,screen:number[]){
 const x=screen[0]+(center[0]-cam.x)*cam.zoom,y=screen[1]+(center[1]-size*.63-cam.y)*cam.zoom;
 const cy=screen[1]+(center[1]-cam.y)*cam.zoom,r=size*cam.zoom/2;const plateFullyVisible=x-r>=12&&x+r<=528&&cy-r>=28&&cy+r<=875;
 return plateFullyVisible&&x-200*cam.zoom>=12&&x+200*cam.zoom<=528&&y>=28&&y+50*cam.zoom<=870;
}
