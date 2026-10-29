import React from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import tokens from './style-tokens.json';
const C = tokens.colors;
export const smooth = (x: number) => { const t = Math.max(0, Math.min(1, x)); return t * t * t * (t * (t * 6 - 15) + 10); };
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const sector = (a: number, b: number, r = 156) => { const pt = (v: number) => `${Math.cos(v) * r},${Math.sin(v) * r}`; return `M0,0 L${pt(a)} A${r},${r} 0 ${b - a > Math.PI ? 1 : 0} 1 ${pt(b)} Z`; };
export function Portion({ progress = 1, values = [.4, .3, .3], active = -1 }: {
    progress?: number;
    values?: number[];
    active?: number;
}) { let a = -Math.PI / 2; return <g>{values.map((v, i) => { const b = a + v * Math.PI * 2, d = sector(a, b); a = b; return <path key={i} d={d} fill={[C.vegetable, C.protein, C.staple][i % 3]} opacity={smooth(progress * 3 - i) * (active < 0 || active === i ? 1 : .28)} stroke={C.paper} strokeWidth={6}/>; })}</g>; }
export function BuildUp({ progress, regions = [.4, .3, .3] }: {
    progress: number;
    regions?: number[];
}) { return <g><circle r={181} fill="none" stroke={C.ink} strokeWidth={2.4} strokeDasharray={1138} strokeDashoffset={1138 * (1 - smooth(progress * 1.8))} transform="rotate(-90)"/><circle r={169} fill="none" stroke={C.line} strokeWidth={1.2} opacity={smooth(progress * 2 - .4)}/><Portion progress={Math.max(0, progress * 1.6 - .5)} values={regions}/></g>; }
export function Comparison({ progress, values, labels }: {
    progress: number;
    values: number[];
    labels: string[];
}) { return <g>{values.map((v, i) => <g key={i} opacity={i === 1 ? 1 : smooth(progress)} transform={`translate(${(i - 1) * 180 * smooth(progress)},0) scale(${mix(1, .48, smooth(progress))})`}><circle r={181} fill={C.paper} stroke={C.ink} strokeWidth={2.4}/><Portion values={[(1 - v) * .57, (1 - v) * .43, v]}/><text y={233} textAnchor="middle" fontSize={24} fill={C.ink}>{labels[i]}</text></g>)}</g>; }
export function Flow({ progress, labels }: {
    progress: number;
    labels: string[];
}) { return <g>{labels.map((s, i) => <g key={s} opacity={smooth(progress * labels.length - i)} transform={`translate(${i * 130},0)`}><text fontSize={17} fill={C.ink}>{s}</text>{i < labels.length - 1 && <path d="M83,-6 h25 m-7,-5 7,5 -7,5" stroke={C.ink} fill="none" strokeWidth={1.2}/>}</g>)}</g>; }
export function Spectrum({ progress, value, labels }: {
    progress: number;
    value: number;
    labels: string[];
}) { return <g><path d="M-150,0 H150" stroke={C.line} strokeWidth={3}/><path d={`M-150,0 H${-150 + 300 * value * smooth(progress)}`} stroke={C.ink} strokeWidth={3}/><rect x={-154 + 300 * value * smooth(progress)} y={-8} width={8} height={16} rx={2} fill={C.ink}/>{labels.map((s, i) => <text key={i} x={i === 0 ? -150 : 150} y={34} textAnchor={i === 0 ? 'start' : 'end'} fontSize={15} fill={C.muted}>{s}</text>)}</g>; }
export function Mechanism({ progress, focus, children }: {
    progress: number;
    focus: [
        number,
        number,
        number
    ];
    children: React.ReactNode;
}) { const t = smooth(progress); return <g transform={`translate(${mix(0, focus[0], t)},${mix(0, focus[1], t)}) scale(${mix(1, focus[2], t)})`}>{children}</g>; }
type Spec = {
    frames: number;
    titles: string[];
    labels: string[];
    disclaimer: string;
    portion_examples: number[];
    camera: {
        overview: number[];
        detail: number[];
        compare: number[];
    };
};
export function VisualGrammarFilm({ spec }: {
    spec: Spec;
}) {
    const f = useCurrentFrame(), part = Math.min(3, Math.floor(f / 90)), local = f % 90;
    const focus = smooth((f - 177) / 55) * (1 - smooth((f - 256) / 36));
    const spread = smooth((f - 274) / 44);
    const cx = mix(spec.camera.overview[0], spec.camera.detail[0], focus), cy = mix(spec.camera.overview[1], spec.camera.detail[1], focus), scale = mix(spec.camera.overview[2], spec.camera.detail[2], focus) * mix(1, spec.camera.compare[2], spread);
    const titleIn = smooth(local / 15);
    const active = f >= 180 && f < 265 ? 2 : f >= 94 && f < 158 ? Math.min(2, Math.floor((f - 94) / 21)) : -1;
    return <AbsoluteFill style={{ background: C.paper, color: C.ink, fontFamily: tokens.type.font }}>
    <svg width="100%" height="100%" viewBox="0 0 540 960">
    <text x={38} y={54} fontSize={13} letterSpacing={2.2}>可樂吉 ／ 餐點筆記</text><text x={502} y={54} textAnchor="end" fontSize={12} fill={C.muted}>VISUAL NOTES — 01</text>
    <defs><clipPath id="title"><rect x={34} y={111} width={475} height={65}/></clipPath></defs>
    <g clipPath="url(#title)"><text x={36} y={161 + 48 * (1 - titleIn)} fontSize={38} fontWeight={600} fill={C.ink}>{spec.titles[part]}</text></g>
    {f >= 270 && <g opacity={smooth((f - 270) / 18)}>{spec.labels.map((label, i) => <g key={label} transform={`translate(${66 + i * 149},220)`}><rect width={12} height={12} y={-11} fill={[C.vegetable, C.protein, C.staple][i]}/><text x={21} fontSize={15} fill={C.ink}>{label}</text></g>)}</g>}
    <g transform={`translate(${cx},${cy}) scale(${scale})`}>
    {spread < .001 ? <BuildUp progress={f / 75}/> : null}
    {spread < .001 && f >= 90 ? <><circle r={181} fill={C.paper} stroke={C.ink} strokeWidth={2.4}/><Portion active={active}/></> : null}
    {spread >= .001 ? <Comparison progress={spread} values={spec.portion_examples} labels={['較少', '中間', '較多']}/> : null}
    {f < 265 && f > 65 && spec.labels.map((label, i) => { const angle = [-.314, 1.885, 3.77][i], x = Math.cos(angle) * 115, y = Math.sin(angle) * 115; const opacity = smooth((f - 65 - i * 7) / 16) * (active < 0 || active === i ? 1 : .35); return <text key={label} x={x} y={y + 6} textAnchor="middle" fontSize={17} opacity={opacity} fill={C.ink}>{label}</text>; })}
    </g>
    {f < 270 ? <g transform="translate(84,776)"><Flow progress={f / 78} labels={['看整體', '看組成', '看需求']}/></g> : <g opacity={smooth((f - 300) / 20)}><text x={270} y={752} textAnchor="middle" fontSize={19}>同一餐點，保留選擇空間。</text></g>}
    <text x={38} y={864} fontSize={14} fill={C.muted}>{part < 2 ? '先建立全貌，再理解細節。' : part === 2 ? '局部聚焦，仍保留整盤參照。' : spec.disclaimer}</text>
    <path d="M38,898 H502" stroke={C.line} strokeWidth={1}/><path d={`M38,898 H${38 + 464 * (f / 359)}`} stroke={C.ink} strokeWidth={2}/><text x={38} y={927} fontSize={11} letterSpacing={1.2}>KELLOGGI · VISUAL GRAMMAR / V2.0</text><text x={502} y={927} textAnchor="end" fontSize={11}>{String(part + 1).padStart(2, '0')} / 04</text>
    </svg></AbsoluteFill>;
}
export function GrammarSampler() { const f = useCurrentFrame(), p = (f % 90) / 89; return <AbsoluteFill style={{ background: C.paper, fontFamily: tokens.type.font }}><svg viewBox="0 0 540 960"><g transform="translate(270,230) scale(.7)"><BuildUp progress={p}/></g><g transform="translate(270,530)"><Spectrum progress={p} value={.65} labels={['較低', '較高']}/></g><g transform="translate(270,730)"><Mechanism progress={p} focus={[-30, 0, 1.3]}><circle r={50} fill="none" stroke={C.ink}/><path d="M-40,0 H40" stroke={C.ink}/></Mechanism></g></svg></AbsoluteFill>; }
