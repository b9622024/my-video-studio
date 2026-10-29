export type Vec=[number,number];export type Pose={x:number;y:number;angle:number;height:number};
export type TransferSpec={width:number;height:number;frames:number;fps:number;base:{asset:string;rect:number[]};receiver:{asset:string;rect:number[];contactPoint:Vec};carrier:{asset:string;sourceSize:number[];anchor:Vec;scale:number};payload:{asset:string;sourceSize:number[];anchor:Vec;scale:number;attachOffset:Vec;rest:Vec};timing:{enter:number;touch:number;release:number;separate:number;exit:number};path:{start:Vec;approachControls:Vec[];touch:Vec;release:Vec;separate:Vec;exitControls:Vec[];exit:Vec};scope:string;public_use_approved:boolean};
const ease=(t:number)=>{const p=Math.max(0,Math.min(1,t));return p*p*p*(p*(p*6-15)+10);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const point=(a:Vec,b:Vec,t:number):Vec=>[mix(a[0],b[0],t),mix(a[1],b[1],t)];
const bezier=(a:Vec,b:Vec,c:Vec,d:Vec,t:number):Vec=>{const u=1-t;return[u*u*u*a[0]+3*u*u*t*b[0]+3*u*t*t*c[0]+t*t*t*d[0],u*u*u*a[1]+3*u*u*t*b[1]+3*u*t*t*c[1]+t*t*t*d[1]];};
export function carrierPose(frame:number,s:TransferSpec):Pose{
 const t=s.timing,p=s.path;let v:Vec,angle:number,height:number;
 if(frame<=t.touch){const u=ease((frame-t.enter)/(t.touch-t.enter));v=bezier(p.start,p.approachControls[0],p.approachControls[1],p.touch,u);angle=0;height=mix(12,2,u);}
 else if(frame<=t.release){const u=ease((frame-t.touch)/(t.release-t.touch));v=point(p.touch,p.release,u);angle=0;height=mix(2,0,u);}
 else if(frame<=t.separate){const u=ease((frame-t.release)/(t.separate-t.release));v=point(p.release,p.separate,u);angle=0;height=mix(0,4,u);}
 else{const u=ease((frame-t.separate)/(t.exit-t.separate));v=bezier(p.separate,p.exitControls[0],p.exitControls[1],p.exit,u);angle=0;height=mix(4,14,u);}
 return{x:v[0],y:v[1],angle,height};
}
export function attachedPayload(carrier:Pose,offset:Vec):Pose{const a=carrier.angle*Math.PI/180;return{x:carrier.x+offset[0]*Math.cos(a)-offset[1]*Math.sin(a),y:carrier.y+offset[0]*Math.sin(a)+offset[1]*Math.cos(a),angle:carrier.angle,height:1.5};}
export function payloadPose(frame:number,s:TransferSpec):Pose{
 if(frame<=s.timing.release)return attachedPayload(carrierPose(frame,s),s.payload.attachOffset);
 const start=attachedPayload(carrierPose(s.timing.release,s),s.payload.attachOffset),u=ease((frame-s.timing.release)/(s.timing.separate-s.timing.release));
 return{x:mix(start.x,s.payload.rest[0],u),y:mix(start.y,s.payload.rest[1],u),angle:mix(start.angle,0,u),height:mix(1.5,0,u)};
}
export function phaseAt(frame:number,s:TransferSpec){const t=s.timing;return frame<t.enter?'initial':frame<t.touch?'carrying':frame<t.release?'contact':frame<t.separate?'sliding_transfer':frame<t.exit?'empty_retreat':'result';}
/** Validate JSON at the boundary instead of blindly casting number[] into coordinate tuples. */
export function assertTransferSpec(value:unknown):asserts value is TransferSpec{
 const obj=(v:unknown,name:string):Record<string,unknown>=>{if(!v||typeof v!=='object'||Array.isArray(v))throw Error('Expected object: '+name);return v as Record<string,unknown>;};
 const nums=(v:unknown,n:number,name:string)=>{if(!Array.isArray(v)||v.length!==n||!v.every(x=>typeof x==='number'&&Number.isFinite(x)))throw Error('Invalid numeric vector: '+name);return v as number[];};
 const s=obj(value,'spec');
 for(const key of ['width','height','fps','frames'])if(!Number.isInteger(s[key])||Number(s[key])<=0)throw Error('Invalid '+key);
 if(Math.abs(Number(s.width)/Number(s.height)-9/16)>1e-6)throw Error('Portrait 9:16 required');
 if(typeof s.scope!=='string'||typeof s.public_use_approved!=='boolean')throw Error('Explicit scope required');
 for(const key of ['base','receiver']){const o=obj(s[key],key),r=nums(o.rect,4,key+'.rect');if(typeof o.asset!=='string'||!o.asset||r[2]<=0||r[3]<=0)throw Error('Invalid '+key);}
 nums(obj(s.receiver,'receiver').contactPoint,2,'receiver.contactPoint');
 for(const key of ['carrier','payload']){const o=obj(s[key],key),size=nums(o.sourceSize,2,key+'.sourceSize'),anchor=nums(o.anchor,2,key+'.anchor');if(typeof o.asset!=='string'||!o.asset||typeof o.scale!=='number'||!Number.isFinite(o.scale)||o.scale<=0||size.some(x=>x<=0)||anchor.some((x,i)=>x<0||x>size[i]))throw Error('Invalid sprite '+key);}
 const payload=obj(s.payload,'payload');nums(payload.attachOffset,2,'payload.attachOffset');nums(payload.rest,2,'payload.rest');
 const t=obj(s.timing,'timing'),order=['enter','touch','release','separate','exit'];let prior=-1;
 for(const key of order){const v=t[key];if(!Number.isInteger(v)||Number(v)<=prior||Number(v)>=Number(s.frames))throw Error('Invalid phase ordering');prior=Number(v);}
 const p=obj(s.path,'path');for(const key of ['start','touch','release','separate','exit'])nums(p[key],2,'path.'+key);
 for(const key of ['approachControls','exitControls']){const arr=p[key];if(!Array.isArray(arr)||arr.length!==2)throw Error('Two Bezier controls required');for(const v of arr)nums(v,2,key);}
}
