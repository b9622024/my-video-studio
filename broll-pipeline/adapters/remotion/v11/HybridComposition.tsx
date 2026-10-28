import React from 'react';
import {AbsoluteFill,Audio,OffthreadVideo,Sequence,interpolate,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';

type Graphic={kind:'portion_concept'|'category_groups'|'process'|'comparison';labels:string[];caption:string;heading?:string|null;values?:number[];unit?:string;source?:string};
type Clip={scene_id:string;option_id:string;mode:string;layout:string;frames:[number,number];narration:string;heading?:string|null;graphic:Graphic|null;crop_parameters:{object_position_x:number;object_position_y:number}|null;local_path?:string;source_seconds?:[number,number];source_sha256?:string};
export type HybridBundle={
 plan:{project_id:string;scenes:{id:string;name:string}[]};
 approved:{project_id:string;revision_id:string;status:string;selections:{option_id:string;review_status:string}[]};
 timeline:{project_id:string;revision_id:string;status:string;fps:number;dimensions:[number,number];duration_frames:number;clips:Clip[];narration:{local_path:string;offset_frame:number;volume:number}|null;captions:{frames:[number,number];text:string}[]};
 manifest:{project_id:string;assets:{asset_id:string;source_sha256?:string}[]};
};
const BG='#111c1a',INK='#f3f1e7',ACCENT='#b4d6ad';
const clamp={extrapolateLeft:'clamp' as const,extrapolateRight:'clamp' as const};
const mediaPath=(p:string)=>{if(!/^media\/[a-zA-Z0-9_-]+\.mp4$/.test(p))throw new Error('Invalid approved media path');return staticFile(p);};

// Diagrams express relationships and change. No nutrition numbers or food cartoons.
const InformationGraphic:React.FC<{graphic:Graphic;compact:boolean}>=({graphic,compact})=>{
 const frame=useCurrentFrame();const {fps,width}=useVideoConfig();
 const progress=interpolate(frame,[0,fps*2.5],[0,1],clamp);
 return <AbsoluteFill style={{padding:compact?'8%':'12%',justifyContent:'center',color:INK}}>
  {graphic.heading?<div style={{fontSize:24*width/540,marginBottom:12}}>{graphic.heading}</div>:null}
  <svg viewBox="0 0 600 380" style={{width:'100%',maxHeight:'75%',overflow:'visible'}} role="img" aria-label={graphic.caption}>
   {graphic.kind==='portion_concept'?<>
    <path d="M50 180 H550" stroke="#537168" strokeWidth="22" strokeLinecap="round"/>
    <path d={`M50 180 H${150+progress*300}`} stroke={ACCENT} strokeWidth="22" strokeLinecap="round"/>
    <circle cx={150+progress*300} cy="180" r="30" fill={INK}/>
    {graphic.labels.map((text,i)=><text key={i} x={60+i*240} y="285" fill={INK} fontSize="29" textAnchor={i===2?'end':i===1?'middle':'start'}>{text}</text>)}
   </>:graphic.kind==='comparison'&&graphic.values?<>
    {graphic.values.map((value,i)=><g key={i}>
     <text x="30" y={70+i*90} fill={INK} fontSize="26">{graphic.labels[i]}</text>
     <rect x="170" y={45+i*90} width={340*value/Math.max(1,...graphic.values!)*progress} height="35" fill={ACCENT}/>
     <text x="540" y={72+i*90} fill={INK} fontSize="24">{value}{graphic.unit}</text>
    </g>)}
   </>:<>
    <path d="M90 210 Q300 30 510 210" fill="none" stroke="#537168" strokeWidth="6"/>
    <path d="M90 210 Q300 30 510 210" fill="none" stroke={ACCENT} strokeWidth="8" pathLength="1" strokeDasharray="1" strokeDashoffset={1-progress}/>
    {graphic.labels.map((text,i)=><g key={i} opacity={interpolate(progress,[i*.2,i*.2+.3],[.22,1],clamp)}>
     <circle cx={90+i*210} cy={i===1?120:210} r="47" fill={BG} stroke={ACCENT} strokeWidth="5"/>
     <text x={90+i*210} y={i===1?207:297} fill={INK} fontSize="28" textAnchor="middle">{text}</text>
    </g>)}
   </>}
  </svg>
  <div style={{fontSize:(compact?16:22)*width/540,lineHeight:1.5,opacity:.8,textAlign:'center'}}>{graphic.caption}</div>
 </AbsoluteFill>;
};

const StoryScene:React.FC<{clip:Clip;showCaption:boolean}>=({clip,showCaption})=>{
 const {width,height,fps}=useVideoConfig();const frame=useCurrentFrame();
 const split=clip.layout==='split_screen',annotation=clip.layout==='contextual_annotation';
 const hasVideo=clip.mode!=='information_motion_graphics';
 const zoom=interpolate(frame,[0,clip.frames[1]-clip.frames[0]],[1,1.025],clamp);
 const videoStyle:React.CSSProperties={position:'absolute',left:0,top:0,width:split?'62%':'100%',height:annotation?'58%':'100%',overflow:'hidden'};
 const graphicStyle:React.CSSProperties={position:'absolute',left:split?'62%':0,top:annotation?'58%':0,width:split?'38%':'100%',height:annotation?'32%':'90%',background:BG};
 return <AbsoluteFill style={{backgroundColor:BG,color:INK,fontFamily:'sans-serif'}}>
  {hasVideo&&clip.local_path&&clip.source_seconds?<div style={videoStyle}>
   <OffthreadVideo muted src={mediaPath(clip.local_path)} trimBefore={Math.round(clip.source_seconds[0]*fps)} trimAfter={Math.round(clip.source_seconds[1]*fps)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:`${(clip.crop_parameters?.object_position_x??.5)*100}% ${(clip.crop_parameters?.object_position_y??.5)*100}%`,transform:`scale(${zoom})`}}/>
  </div>:null}
  {clip.graphic?<div style={graphicStyle}><InformationGraphic graphic={{...clip.graphic,heading:clip.heading}} compact={split||annotation}/></div>:null}
  {/* Caption space is separate from diagram labels; source footage has no title cards. */}
  {showCaption?<div style={{position:'absolute',left:width*.06,right:width*.06,bottom:height*.025,background:'rgba(10,22,18,.88)',padding:`${height*.012}px ${width*.025}px`,borderRadius:8,fontSize:width*.043,lineHeight:1.45,textAlign:'center'}}>{clip.narration}</div>:null}
 </AbsoluteFill>;
};

export const HybridComposition:React.FC<{bundle:HybridBundle}>=({bundle})=>{
 const {plan,approved,timeline,manifest}=bundle;
 if(approved.status!=='approved'||timeline.status!=='approved_for_preview'||[approved.project_id,timeline.project_id,manifest.project_id].some(id=>id!==plan.project_id)||approved.revision_id!==timeline.revision_id)throw new Error('User approval and matching compiled bundle are required.');
 if(timeline.clips.some(c=>!approved.selections.some(a=>a.option_id===c.option_id&&a.review_status==='approved')))throw new Error('Unapproved scene');
 const voice=timeline.narration;
 if(voice&&!/^audio\/[a-zA-Z0-9_-]+\.(wav|mp3|m4a)$/.test(voice.local_path))throw new Error('Invalid narration path');
 return <AbsoluteFill style={{background:BG}}>
  {timeline.clips.map(clip=><Sequence key={clip.scene_id} from={clip.frames[0]} durationInFrames={clip.frames[1]-clip.frames[0]}><StoryScene clip={clip} showCaption={timeline.captions.length===0}/></Sequence>)}
  {voice?<Sequence from={voice.offset_frame}><Audio src={staticFile(voice.local_path)} volume={voice.volume}/></Sequence>:null}
  {timeline.captions.map((c,i)=><Sequence key={i} from={c.frames[0]} durationInFrames={c.frames[1]-c.frames[0]}><AbsoluteFill style={{justifyContent:'flex-end',alignItems:'center',paddingBottom:'3%',color:INK}}>{c.text}</AbsoluteFill></Sequence>)}
 </AbsoluteFill>;
};
