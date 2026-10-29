import React, { useId } from 'react';
import tokens from './style-tokens.json';
import spec from './prototypes.json';
import { progress, smooth } from './MotionMath';
const C = tokens.colors;
const outline = { stroke: C.ink, strokeWidth: tokens.stroke.outline, strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
const detail = { stroke: C.ink, strokeWidth: tokens.stroke.detail, fill: 'none', strokeLinejoin: 'round' as const, strokeLinecap: 'round' as const };
/** Eight flared eight-floor modules, narrowing crown, pedestal, distinct spire. No text identity crutch. */
export function Taipei101({ frame = 74, timing = spec.timeline.A }: {
    frame?: number; timing?: typeof spec.timeline.A;
}) {
    const id = useId().replace(/:/g, '');
    const silhouette = progress(frame, timing.setup), built = progress(frame, timing.tiers), spire = progress(frame, timing.spire);
    return <g>
 <defs><clipPath id={id}><rect x={150} y={760 - 560 * silhouette} width={240} height={560 * silhouette}/></clipPath></defs>
 <ellipse cx={270} cy={753} rx={116} ry={13} fill={C.ink} opacity={.055}/>
 <g clipPath={`url(#${id})`}>
 <path d="M166 747 V716 L188 706 V681 H213 V247 L236 225 H304 L327 247 V681 H352 V706 L374 716 V747 Z" fill={C.sage} fillOpacity={.12} {...outline}/>
 <path d="M166 747 V716 L188 706 H352 L374 716 V747 Z" fill={C.sage} {...outline}/>
 <path d="M188 706 V682 H352 V706 M213 682 V653 H327 V682" {...detail}/>
 <path d="M220 719 V746 M242 719 V746 M270 719 V746 M298 719 V746 M320 719 V746" {...detail} opacity={.45}/>
 </g>
 {Array.from({ length: 8 }, (_, i) => {
            const y = 654 - i * 50, w = 142 - i * 3.6, p = smooth(built * 8 - i), left = 270 - w / 2, right = 270 + w / 2;
            return <g key={i}>
 <defs><clipPath id={`${id}-${i}`}><rect x={170} y={y - 48 * p} width={200} height={48 * p}/></clipPath></defs>
 <g clipPath={`url(#${id}-${i})`}>
 <path d={`M${left + 10} ${y} L${left} ${y - 44} L${left + 4} ${y - 48} H${right - 4} L${right} ${y - 44} L${right - 10} ${y} Z`} fill={C.sage} {...outline}/>
 <path d={`M270 ${y - 47} V${y} M${left + 9} ${y - 34} H${right - 9} M${left + 12} ${y - 23} H${right - 12} M${left + 15} ${y - 12} H${right - 15}`} {...detail} opacity={.55}/>
 <path d={`M${left + 26} ${y - 40} L${left + 31} ${y - 5} M${right - 26} ${y - 40} L${right - 31} ${y - 5}`} {...detail} opacity={.3}/>
 </g></g>;
        })}
 <g opacity={spire}>
 <path d="M225 256 V231 L237 219 V198 H303 V219 L315 231 V256 Z" fill={C.sage} {...outline}/>
 <path d="M244 198 V181 H296 V198 M254 181 V165 H286 V181 M263 165 V137 H277 V165" fill={C.sage} {...outline}/>
 <path d="M270 137 V105 M242 235 H298 M244 246 H296 M253 210 H287" {...detail}/>
 </g>
 </g>;
}
export function MilkCarton({ angle = 0, spout: [x, y] = [341, 390] }: {
    angle?: number;
    spout?: number[];
}) {
    // All pouring motion pivots at the same outlet; the stream stays connected to its source.
    return <g transform={`translate(${x},${y}) rotate(${angle})`}>
 <path d="M0 0 L25 -25 H83 L102 0 V139 H0 Z" fill={C.paper} {...outline}/>
 <path d="M0 0 H75 L102 -0 M75 0 V139 M25 -25 L46 0 M83 -25 L75 0" {...detail}/>
 <path d="M0 35 H75 V110 H0 Z" fill={C.sage} stroke={C.ink} strokeWidth={2}/>
 <path d="M75 35 H102 V110 H75" fill={C.sage} fillOpacity={.45} stroke={C.ink} strokeWidth={2}/>
 <path d="M23 65 C23 56 34 46 37 43 C42 51 52 59 52 68 C52 83 23 84 23 65 Z" fill={C.paper} stroke={C.ink} strokeWidth={2}/>
 <path d="M-10 -2 L2 -8 L11 -1 L2 6 Z" fill={C.paper} {...outline}/>
 </g>;
}
export function Glass({ surface = 648 }: {
    surface?: number;
}) {
    const id = useId().replace(/:/g, '');
    return <g>
 <defs><clipPath id={id}><path d="M170 480 L190 667 Q255 697 320 667 L340 480 Q255 455 170 480 Z"/></clipPath></defs>
 <ellipse cx={255} cy={700} rx={106} ry={17} fill={C.ink} opacity={.055}/>
 <path d="M163 480 L184 674 Q255 710 326 674 L347 480" fill={C.sage} fillOpacity={.10} {...outline}/>
 <g clipPath={`url(#${id})`}>
 <path d={`M155 ${surface} H355 V710 H155 Z`} fill="#FFFEF9"/>
 <ellipse cx={255} cy={surface} rx={86} ry={13} fill="#FFFEF9" stroke={C.ink} strokeOpacity={.38} strokeWidth={2}/>
 </g>
 <path d="M163 480 L184 674 Q255 710 326 674 L347 480" fill="none" {...outline}/>
 <ellipse cx={255} cy={480} rx={92} ry={19} fill="none" {...outline}/>
 <path d="M181 511 L197 654 M333 512 L319 653" stroke={C.paper} strokeWidth={5} strokeLinecap="round"/>
 <path d="M199 678 Q255 698 311 678" {...detail} opacity={.35}/>
 </g>;
}
export function MilkPour({ angle = 0, surface = 648, front = 0, tail = 0, spout = [341, 390] }: {
    angle?: number;
    surface?: number;
    front?: number;
    tail?: number;
    spout?: number[];
}) {
    const id = useId().replace(/:/g, '');
    const target = surface - 2;
    const path = `M${spout[0]} ${spout[1]} C${spout[0] - 57} ${spout[1] + 14} 255 442 255 ${target}`;
    return <g>
 <Glass surface={surface}/>
 <defs><clipPath id={id}><rect x={120} y={spout[1] + (target - spout[1]) * tail - 8} width={300} height={Math.max(0, (target - spout[1]) * (front - tail) + 16)}/></clipPath></defs>
 {front > tail && <g clipPath={`url(#${id})`}><path d={path} stroke={C.ink} strokeOpacity={.6} strokeWidth={12} fill="none" strokeLinecap="round"/><path d={path} stroke="#FFFEF9" strokeWidth={8} fill="none" strokeLinecap="round"/></g>}
 <path d="M163 480 C163 505 347 505 347 480" fill="none" {...outline}/>
 <MilkCarton angle={angle} spout={spout}/>
 </g>;
}
export function Rice() {
    return <g>
 <path d="M174 587 C170 579 179 564 189 562 C187 554 196 543 208 543 C211 535 225 528 236 531 C244 522 259 521 269 527 C282 522 295 530 300 537 C315 535 325 543 327 552 C342 555 350 567 346 577 C358 584 356 596 344 602 C306 619 215 623 181 603 C174 600 169 593 174 587 Z" fill="#FFFEF9" {...outline}/>
 {[[199, 572, -18], [220, 550, 20], [244, 537, -25], [266, 549, 17], [293, 539, -18], [318, 558, 28], [336, 582, -16], [307, 591, 16], [278, 579, -20], [250, 595, 30], [224, 580, -25], [196, 592, 23]].map(([x, y, a], i) => <path key={i} d={`M${x - 4} ${y} q4 -3.5 9 0 q-4 3.5 -9 0`} fill={C.paper} stroke={C.ink} strokeOpacity={.42} strokeWidth={1.5} transform={`rotate(${a},${x},${y})`}/>)}
 </g>;
}
export function Vegetables() {
    return <g>
 <path d="M149 502 C143 479 147 452 164 431 C187 430 205 445 206 468 C203 490 186 507 171 516 Z" fill={C.sage} {...outline}/>
 <path d="M157 493 Q169 469 165 441 M163 473 L184 457 M158 486 L150 470" {...detail}/>
 <path d="M171 493 C175 463 198 445 222 448 C235 473 220 500 192 509 Z" fill={C.sage} {...outline}/>
 <path d="M184 498 L215 458 M196 482 L215 478 M203 472 L199 458" {...detail}/>
 <path d="M202 515 L214 490 L238 477 L248 482 L227 502 L222 520 Z" fill={C.sage} {...outline}/>
 <path d="M218 474 C206 476 201 462 210 454 C204 440 218 428 230 434 C240 419 260 425 263 437 C280 436 286 453 275 463 C280 480 265 490 252 483 C239 496 222 489 218 474 Z" fill={C.sage} {...outline}/>
 <path d="M230 451 Q241 442 247 453 M253 469 Q265 458 271 464 M219 469 Q227 459 235 467" {...detail} opacity={.6}/>
 </g>;
}
export function Protein() {
    return <g>
 <path d="M287 445 C309 423 347 424 371 448 C389 466 388 485 372 495 C350 507 315 502 291 483 C276 473 275 459 287 445 Z" fill={C.orange} fillOpacity={.78} {...outline}/>
 <path d="M287 458 C309 440 347 438 373 458 M288 473 C314 490 349 498 372 486" {...detail} opacity={.55}/>
 <path d="M310 450 L304 463 M330 446 L323 465 M350 450 L342 470 M367 461 L360 477" {...detail}/>
 </g>;
}
export function Plate({ frame = 74, timing = spec.timeline.C }: {
    frame?: number; timing?: typeof spec.timeline.C;
}) {
    const id = useId().replace(/:/g, '');
    const p = progress(frame, timing.plate), v = progress(frame, timing.vegetable), m = progress(frame, timing.protein), r = progress(frame, timing.rice);
    return <g>
 <ellipse cx={270} cy={647} rx={203} ry={31} fill={C.ink} opacity={.055 * p}/>
 <ellipse cx={270} cy={532} rx={211} ry={157} fill="#FFFEF9" opacity={p}/>
 <ellipse cx={270} cy={526} rx={211} ry={157} fill="none" {...outline} pathLength={1} strokeDasharray={1} strokeDashoffset={1 - p}/>
 <ellipse cx={270} cy={526} rx={190} ry={136} fill="none" stroke={C.ink} strokeOpacity={.22} strokeWidth={2} opacity={p}/>
 <defs>
 <clipPath id={`${id}-v`}><rect x={130} y={420} width={154 * v} height={115}/></clipPath>
 <clipPath id={`${id}-m`}><rect x={273} y={417} width={119 * m} height={100}/></clipPath>
 <clipPath id={`${id}-r`}><path d={`M160 507 H365 V${507 + 118 * r} H160 Z`}/></clipPath>
 </defs>
 <g clipPath={`url(#${id}-v)`}><Vegetables /></g><g clipPath={`url(#${id}-m)`}><Protein /></g><g clipPath={`url(#${id}-r)`}><Rice /></g>
 </g>;
}
