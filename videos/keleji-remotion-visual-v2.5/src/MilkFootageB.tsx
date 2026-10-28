import React from 'react';
import {AbsoluteFill,OffthreadVideo,staticFile,useCurrentFrame} from 'remotion';
import {ease,Ready,StudyTitle} from './v23-shared';
// Existing supported Remotion native decoder avoids mutating V2.2 shared dependencies.
export const MilkFootageB:React.FC=()=>{const f=useCurrentFrame(),camera=ease(f,0,119);return <AbsoluteFill style={{background:'#f3eee5'}}><Ready/><OffthreadVideo src={staticFile('assets/pexels-6535488-4to8-30fps.mp4')} muted style={{width:'100%',height:'100%',objectFit:'cover',transform:`scale(${1+.045*camera}) translate(${-10*camera}px,${-8*camera}px)`,transformOrigin:'61% 65%',filter:'sepia(.075) saturate(.9) contrast(1.025)'}}/><StudyTitle/></AbsoluteFill>;};
