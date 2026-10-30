export const config={world:[941,1672],carton:{scale:.73,gripLocal:[760,530],gripWorld:[909.38,227.76],outletLocal:[205,748],bodyReferenceLocal:[1350,480],angles:{start:15,pour:0,returned:15}},glass:{translate:[5,478],scale:[.74,.68],mouth:{center:[470,320],radius:[427,186]},innerFloor:{center:[470,1290],radius:[275,85]},entryWorld:[400,700],innerPath:'M43 320 C43 217 235 134 470 134 C705 134 897 217 897 320 L745 1290 C745 1336.944 621.878 1375 470 1375 C318.122 1375 195 1336.944 195 1290 Z'}};
export function localToWorld(p:readonly number[],angle:number){const c=config.carton,r=angle*Math.PI/180,dx=(p[0]-c.gripLocal[0])*c.scale,dy=(p[1]-c.gripLocal[1])*c.scale;return[c.gripWorld[0]+Math.cos(r)*dx-Math.sin(r)*dy,c.gripWorld[1]+Math.sin(r)*dx+Math.cos(r)*dy] as const;}
export function outletAt(angle:number){return localToWorld(config.carton.outletLocal,angle)}
export function levelGeometry(y:number){const p=Math.max(0,Math.min(1,(y-320)/970));return{cx:470,cy:y,rx:427-152*p,ry:186-101*p};}
export const poses={A:{angle:15,level:1260,flow:false},B:{angle:0,level:850,flow:true},C:{angle:15,level:850,flow:false},D:{angle:0,level:1260,flow:false},E:{angle:0,level:950,flow:true}};

export function reviewAngleAt(frame:number){const ease=(a:number,b:number)=>{const t=Math.max(0,Math.min(1,(frame-a)/(b-a)));return t*t*t*(t*(t*6-15)+10)};return 15*(1-ease(0,11))+15*ease(54,71);}
export function outletAtFrame(frame:number){return outletAt(reviewAngleAt(frame));}
