import React, { useId } from 'react';
import { AbsoluteFill } from 'remotion';
import config from './config.json';
const C = { paper: '#F6F3EC', ink: '#182F40', sage: '#8FAA96', gold: '#E3B35F', gray: '#7B8589' };
const stroke = { stroke: C.ink, strokeWidth: 2.3, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
type Camera = {
    target: number[];
    scale: number;
};
const camTransform = (camera: Camera) => `translate(270,480) scale(${camera.scale}) translate(${-camera.target[0]},${-camera.target[1]})`;
const deflect = (y: number, top: number) => top * Math.pow(Math.max(0, (747 - y) / 642), 2);
const path = (points: number[][], top: number, close = true) => points.map(([x, y], i) => `${i ? 'L' : 'M'}${x + deflect(y, top)},${y}`).join(' ') + (close ? ' Z' : '');
/** A deformable rendition of the existing original V201 design. Base does not translate. */
export function Tower({ top = 0, reveal = 0 }: {
    top?: number;
    reveal?: number;
}) {
    const id = useId().replace(/:/g, '');
    const dx = deflect(300, top);
    return <g>
 <defs><mask id={id}><rect x="-1000" y="-1000" width="3000" height="3000" fill="white"/>{reveal>0 && <rect x={232 + dx} y={246} width={76} height={108*reveal} fill="black"/>}</mask></defs>
 <g mask={`url(#${id})`}>
 <path vectorEffect="non-scaling-stroke" d={path([[166, 747], [166, 716], [188, 706], [188, 682], [213, 682], [213, 247], [236, 225], [304, 225], [327, 247], [327, 682], [352, 682], [352, 706], [374, 716], [374, 747]], top)} fill={C.sage} fillOpacity={.2} {...stroke}/>
 <path vectorEffect="non-scaling-stroke" d={path([[166, 747], [166, 716], [188, 706], [352, 706], [374, 716], [374, 747]], top)} fill={C.sage} {...stroke}/>
 {[220, 242, 270, 298, 320].map(x => <path vectorEffect="non-scaling-stroke" key={x} d={path([[x, 720], [x, 745]], top, false)} fill="none" stroke={C.ink} strokeWidth={1.3} opacity={.45}/>)}
 {Array.from({ length: 8 }, (_, i) => {
            const y = 654 - i * 50, w = 142 - i * 3.6, l = 270 - w / 2, r = 270 + w / 2;
            return <g key={i}>
 <path vectorEffect="non-scaling-stroke" d={path([[l + 10, y], [l, y - 44], [l + 4, y - 48], [r - 4, y - 48], [r, y - 44], [r - 10, y]], top)} fill={C.sage} {...stroke}/>
 <path vectorEffect="non-scaling-stroke" d={path([[270, y - 47], [r - 4, y - 47], [r, y - 44], [r - 10, y], [270, y]], top)} fill={C.ink} opacity={.075}/>
 {[12, 23, 34].map(d => <path vectorEffect="non-scaling-stroke" key={d} d={path([[l + 6 + d * .24, y - d], [r - 6 - d * .24, y - d]], top, false)} stroke={C.ink} strokeWidth={1.1} opacity={.42}/>)}
 <path vectorEffect="non-scaling-stroke" d={path([[270, y - 46], [270, y - 1]], top, false)} stroke={C.ink} strokeWidth={1.15} opacity={.4}/>
 </g>;
        })}
 <path vectorEffect="non-scaling-stroke" d={path([[225, 256], [225, 231], [237, 219], [237, 198], [303, 198], [303, 219], [315, 231], [315, 256]], top)} fill={C.sage} {...stroke}/>
 <path vectorEffect="non-scaling-stroke" d={path([[244, 198], [244, 181], [254, 181], [254, 165], [263, 165], [263, 137], [277, 137], [277, 165], [286, 165], [286, 181], [296, 181], [296, 198]], top)} fill={C.sage} {...stroke}/>
 <path vectorEffect="non-scaling-stroke" d={path([[270, 137], [270, 105]], top, false)} stroke={C.ink} strokeWidth={1.8}/>
 {[210, 235, 246].map(y => <path vectorEffect="non-scaling-stroke" key={y} d={path([[244, y], [296, y]], top, false)} stroke={C.ink} strokeWidth={1.2} opacity={.4}/>)}
 </g>
 </g>;
}
export function Skyline() {
    return <g>
 <rect x={-100} y={747} width={800} height={300} fill={C.sage} opacity={.055}/>
 {[[7, 641, 49], [66, 593, 48], [122, 666, 42], [360, 627, 43], [415, 568, 47], [477, 650, 64]].map(([x, y, w], i) => <g key={i}><path d={`M${x} 747 V${y} H${x + w} V747`} fill={C.gray} opacity={.13}/>{Array.from({ length: 4 }, (_, j) => <path key={j} d={`M${x + 9} ${y + 18 + j * 20} H${x + w - 9}`} stroke={C.paper} strokeWidth={2.5} opacity={.7}/>)}</g>)}
 <path d="M-80 747 H620" stroke={C.ink} strokeWidth={1.3} opacity={.2}/>
 </g>;
}
export function Street() { return <g><path d="M-50 770 H590 V815 H-50 Z" fill={C.paper}/><path d="M-50 770 H590" stroke={C.ink} strokeWidth={2}/><path d="M-50 782 H590" stroke={C.gray} strokeWidth={1} opacity={.35}/><path d="M-10 770 V730 H67 V770 M459 770 V737 H558 V770" fill={C.sage} fillOpacity={.12} stroke={C.ink} strokeWidth={1.7}/><path d="M17 730 Q-8 683 5 669 Q32 679 26 714 Q44 674 62 684 Q69 712 36 730 M484 737 Q463 706 474 693 Q495 699 497 726 Q510 688 531 700 Q531 724 503 737" fill={C.sage} stroke={C.ink} strokeWidth={1.7}/></g>; }
export function DamperLink({ a, b }: {
    a: number[];
    b: number[];
}) {
    const [x, y] = a, [u, v] = b;
    const angle = Math.atan2(v - y, u - x) * 180 / Math.PI, len = Math.hypot(u - x, v - y);
    return <g transform={`translate(${x},${y}) rotate(${angle})`}>
 <path d={`M0 0 H${len}`} stroke={C.paper} strokeWidth={1.5}/><rect x={2} y={-1.6} width={config.geometry.cylinder_body_length} height={3.2} rx={.5} fill={C.sage} stroke={C.ink} strokeWidth={.45}/><path d={`M${config.geometry.cylinder_body_length+2} 0 H${len}`} stroke={C.paper} strokeWidth={1}/><circle r={1.3} fill={C.gold}/><circle cx={len} r={1.3} fill={C.gold}/>
 </g>;
}
export function Chamber({ top = 0, relative = 0, front = false, reveal = 1 }: {
    top?: number;
    relative?: number;
    front?: boolean; reveal?: number;
}) {
    const clipId=useId().replace(/:/g,'');
    const dx = deflect(300, top), x = 270 + relative, y = 312 + Math.sqrt(48 * 48 - relative * relative) - 48;
    if (front)
        return <g transform={`translate(${dx},0)`}><defs><clipPath id={clipId}><rect x={228} y={246} width={84} height={110*reveal}/></clipPath></defs><g clipPath={`url(#${clipId})`}><path vectorEffect="non-scaling-stroke" d="M232 246 V354 H308 V246" fill="none" stroke={C.ink} strokeWidth={2.5}/><path d="M232 350 H308 V355 H232 Z" fill={C.paper} stroke={C.ink} strokeWidth={.8}/><path d="M230 275 V339 M310 275 V339" stroke={C.sage} strokeWidth={3}/></g></g>;
    return <g transform={`translate(${dx},0)`}><defs><clipPath id={clipId}><rect x={232} y={246} width={76} height={108*reveal}/></clipPath><radialGradient id={`${clipId}-gold`} cx="32%" cy="26%" r="78%"><stop offset="0" stopColor="#ECCC8B"/><stop offset=".6" stopColor={C.gold}/><stop offset="1" stopColor="#BB8E49"/></radialGradient></defs><g clipPath={`url(#${clipId})`}>
 <rect x={232} y={246} width={76} height={108} fill={C.ink}/>
 <path d="M236 254 H304 M236 276 H243 M297 276 H304 M236 298 H242 M298 298 H304 M236 338 H243 M297 338 H304" stroke={C.paper} opacity={.2} strokeWidth={.8}/>
 <path d="M239 250 H301" stroke={C.sage} strokeWidth={3}/>
 {[[-12, -1], [-12, 1], [12, -1], [12, 1]].map(([offset, strand], i) => <path key={i} d={`M${270 + offset + strand * .6} 252 L${x + offset + strand * .6} ${y - 12}`} stroke={C.paper} strokeWidth={.55}/>)}
 <path d="M258 249 V253 M282 249 V253" stroke={C.gold} strokeWidth={2}/>
 <circle cx={x} cy={y} r={17} fill={`url(#${clipId}-gold)`} stroke={C.paper} strokeOpacity={.4} strokeWidth={.5}/>
 {[-11, -6, 0, 6, 11].map(d => <path key={d} d={`M${x - Math.sqrt(17 * 17 - d * d) + 1} ${y + d} Q${x} ${y + d + 1.2} ${x + Math.sqrt(17 * 17 - d * d) - 1} ${y + d}`} stroke={C.ink} strokeOpacity={.18} strokeWidth={.55} fill="none"/>)}
 <path d={`M${x - 18} ${y + 3} Q${x - 18} ${y + 18} ${x} ${y + 18} Q${x + 18} ${y + 18} ${x + 18} ${y + 3}`} fill="none" stroke={C.sage} strokeWidth={1.6}/>
 <DamperLink a={[236, 348]} b={[x - 12, y + config.geometry.cradle_attach_y]}/><DamperLink a={[304, 348]} b={[x + 12, y + config.geometry.cradle_attach_y]}/>
 </g></g>;
}
export function Layer({ camera, children, z = 0 }: {
    camera: Camera;
    children: React.ReactNode;
    z?: number;
}) { return <AbsoluteFill style={{ zIndex: z }}><svg viewBox="0 0 540 960" width="100%" height="100%"><g transform={camTransform(camera)}>{children}</g></svg></AbsoluteFill>; }
