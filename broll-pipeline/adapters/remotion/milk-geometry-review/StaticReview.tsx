import React,{useEffect,useState}from'react';import{AbsoluteFill,staticFile,delayRender,continueRender,cancelRender}from'remotion';import{config as c,poses,outletAt,localToWorld,levelGeometry}from'./Geometry';
export function StaticReview({id='B',diagnostic=false}:{id:keyof typeof poses;diagnostic:boolean}){const pose=poses[id],level=levelGeometry(pose.level),source=outletAt(pose.angle),hit=[5+.74*470,478+.68*pose.level],entry=c.glass.entryWorld;const[wait]=useState(()=>delayRender('unchanged art'));useEffect(()=>{Promise.all(['carton-original.png','glass-empty-original.png'].map(n=>{const im=new Image();im.src=staticFile('assets/'+n);return im.decode()})).then(()=>continueRender(wait)).catch(cancelRender)},[wait]);
const stream=`M${source[0]},${source[1]} C${source[0]-45},${source[1]+110} ${entry[0]+25},${entry[1]-100} ${entry[0]},${entry[1]} S${hit[0]},${hit[1]-70} ${hit[0]},${hit[1]}`;
return <AbsoluteFill style={{background:'#F6F3EC'}}><svg width="100%" height="100%" viewBox="0 0 941 1672">
<defs>
<radialGradient id="paper"><stop stopColor="#FFF9EB"/><stop offset="1" stopColor="#F1EADB"/></radialGradient>
<linearGradient id="milk"><stop stopColor="#FFFCED"/><stop offset=".65" stopColor="#F8F0DD"/><stop offset="1" stopColor="#EADCC2"/></linearGradient>
<clipPath id="cavity"><path d={c.glass.innerPath}/></clipPath>
<mask id="foreground"><rect width="941" height="1671" fill="white"/><path d={c.glass.innerPath} fill="black"/><path d="M20 320 C20 433 221 525 470 525 C719 525 923 433 923 320" fill="none" stroke="white" strokeWidth="25"/></mask>
<clipPath id="carton"><path d="M294 285 L583 216 L1134 30 Q1140 28 1146 34 L1455 211 L1411 627 L505 968 L200 754 L142 584 L286 383Z"/></clipPath>
</defs>
<rect width="941" height="1672" fill="url(#paper)"/>
<path d="M97 1463 Q365 1418 676 1457 L1080 1592 L1080 1672 H712 L111 1564Z" fill="#776F61" opacity=".14"/>
<g transform="translate(5,478) scale(.74,.68)">
<image href={staticFile('assets/glass-empty-original.png')} width="941" height="1671"/>
<g clipPath="url(#cavity)"><rect x="0" y={pose.level} width="941" height={1671-pose.level} fill="url(#milk)"/><ellipse {...{cx:level.cx,cy:level.cy,rx:level.rx,ry:level.ry}} fill="#FFF9E9"/>
<path d={`M${level.cx-level.rx},${pose.level} A${level.rx},${level.ry} 0 0 1 ${level.cx+level.rx},${pose.level}`} fill="none" stroke="#D7C6A9" strokeOpacity=".3" strokeWidth="3"/>
</g></g>
{pose.flow&&<><path d={stream} stroke="#F8F0DD" strokeWidth="43" fill="none"/><path d={stream} stroke="#FFFCEE" strokeWidth="15" fill="none"/><ellipse cx={hit[0]} cy={hit[1]} rx="24" ry="7" fill="none" stroke="#D8C6A6" strokeWidth="4"/></>}
<g transform="translate(5,478) scale(.74,.68)"><image href={staticFile('assets/glass-empty-original.png')} width="941" height="1671" mask="url(#foreground)"/>
{diagnostic&&<><path d={c.glass.innerPath} fill="none" stroke="#C45646" strokeWidth="4" strokeDasharray="12 8"/><ellipse cx="470" cy="1290" rx="275" ry="85" fill="none" stroke="#47859B" strokeWidth="4"/><ellipse cx="470" cy="320" rx="427" ry="186" fill="none" stroke="#47859B" strokeWidth="4"/></>}
</g>
<g transform={`translate(${c.carton.gripWorld.join(',')}) rotate(${pose.angle}) scale(${c.carton.scale}) translate(-760,-530)`}><image href={staticFile('assets/carton-original.png')} width="1536" height="1024" clipPath="url(#carton)"/></g>
{diagnostic&&<g fontFamily="sans-serif" fontSize="23" fill="#182F40">
{[[...c.carton.gripWorld,'grip','#8F4FA4'],[...source,'outlet','#C45646'],[...entry,'mouth entry','#47859B'],[...hit,'contact','#4F865A']].map(([x,y,label,color])=><g key={String(label)}><circle cx={Number(x)} cy={Number(y)} r="9" fill={String(color)} stroke="white" strokeWidth="2"/><text x={Number(x)-128} y={Number(y)-15}>{String(label)}</text></g>)}
<path d={`M${c.carton.gripWorld.join(',')} L${source.join(',')} L${entry.join(',')} L${hit.join(',')}`} fill="none" stroke="#C45646" strokeWidth="2" strokeDasharray="12 8"/>
<text x="35" y="55">{id}: {pose.angle} deg / static diagnostic</text>
</g>}
</svg></AbsoluteFill>;
}
