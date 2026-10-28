import React from 'react';
import {Composition,Folder} from 'remotion';
import {MilkPour} from './MilkPour';
import {MilkEditorialA} from './MilkEditorialA';
import {MilkFootageB} from './MilkFootageB';
export const RemotionRoot=()=> <><Folder name="V22-Preserved"><Composition id="MilkPourStudy" component={MilkPour} durationInFrames={120} fps={30} width={1080} height={1920}/></Folder><Composition id="MilkEditorialA" component={MilkEditorialA} durationInFrames={120} fps={30} width={1080} height={1920}/><Composition id="MilkFootageB" component={MilkFootageB} durationInFrames={120} fps={30} width={1080} height={1920}/></>;
