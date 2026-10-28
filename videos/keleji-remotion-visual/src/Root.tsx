import React from 'react';
import {Composition} from 'remotion';
import {MilkPour} from './MilkPour';
export const RemotionRoot = () => <Composition id="MilkPourStudy" component={MilkPour} durationInFrames={120} fps={30} width={1080} height={1920}/>;
