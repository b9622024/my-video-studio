import React from 'react';
import {AbsoluteFill,OffthreadVideo,Sequence,staticFile} from 'remotion';
export type EditInput={schema_version:string;status:string;fps:number;dimensions:number[];duration_frames:number;clips:{asset_id:string;scene_id:string;frames:number[];source_seconds:number[];local_path:string;source_sha256:string;crop_parameters:{verified:boolean;object_position_x:number;object_position_y:number}}[]};
/** Minimal media consumer for the V2.5 host; no new rendering engine or voice module. */
export const ApprovedBrollAdapter:React.FC<{edit:EditInput}>=({edit})=>{
 if(edit.status!=='approved_for_edit'||edit.schema_version!=='1.0'||!edit.clips.length)throw new Error('Only approved edit input can render.');
 return <AbsoluteFill>{edit.clips.map(c=>{
  if(!/^media\/pixabay-\d+\.mp4$/.test(c.local_path)||!/^[a-f0-9]{64}$/.test(c.source_sha256)||!c.crop_parameters.verified)throw new Error('Invalid approved media contract.');
  return <Sequence key={c.scene_id} from={c.frames[0]} durationInFrames={c.frames[1]-c.frames[0]}><OffthreadVideo muted src={staticFile(c.local_path)} trimBefore={Math.round(c.source_seconds[0]*edit.fps)} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:`${c.crop_parameters.object_position_x*100}% ${c.crop_parameters.object_position_y*100}%`}}/></Sequence>;
 })}</AbsoluteFill>;
};
