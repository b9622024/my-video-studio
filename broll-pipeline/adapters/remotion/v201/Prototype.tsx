import React, { useId } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import { Taipei101, MilkPour, Plate } from './Objects';
import { milkState, progress } from './MotionMath';
import tokens from './style-tokens.json';
import spec from './prototypes.json';
export type PrototypeId = 'A' | 'B' | 'C';
export function Prototype({ id = 'A', text = true }: {
    id: PrototypeId;
    text: boolean;
}) {
    const frame = useCurrentFrame(), clip = useId().replace(/:/g, '');
    const state = milkState(frame, spec.milk, spec.timeline.B);
    return <AbsoluteFill style={{ background: tokens.colors.paper, fontFamily: tokens.type.font }}>
 <svg viewBox="0 0 540 960" width="100%" height="100%" role="img" aria-label={spec.objects[id]}>
 {text && <g fill={tokens.colors.ink}><text x={38} y={55} fontSize={14} letterSpacing={1.3}>可樂吉健康研究所</text><text x={38} y={112} fontSize={32} fontWeight={500}>{spec.objects[id]}</text></g>}
 {id === 'A' ? <Taipei101 frame={frame} timing={spec.timeline.A}/> : id === 'B' ? <>
 <defs><clipPath id={clip}><rect x={105} y={720 - 470 * state.setup} width={435} height={470 * state.setup}/></clipPath></defs>
 <g clipPath={`url(#${clip})`}><MilkPour angle={state.angle} surface={state.surface} front={state.front} tail={state.tail} spout={spec.milk.spout}/></g>
 </> : <g transform="translate(0,-15)"><Plate frame={frame} timing={spec.timeline.C}/></g>}
 {text && <g fill={tokens.colors.ink} opacity={progress(frame, [60, 65])}><text x={38} y={831} fontSize={22}>{spec.titles[id]}</text><text x={38} y={890} fontSize={12} fill={tokens.colors.gray}>KELEJI ／ RECOGNIZABLE MINIMAL MOTION</text></g>}
 </svg></AbsoluteFill>;
}
