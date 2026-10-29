export type Interval = readonly [
    number,
    number
];
export const clamp = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const t = clamp(x); return t * t * t * (t * (t * 6 - 15) + 10); };
export const progress = (frame: number, interval: readonly number[]) => smooth((frame - interval[0]) / (interval[1] - interval[0]));
export const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
export function milkState(frame: number, config: {
    initial_surface_y: number;
    final_surface_y: number;
    pour_angle: number;
}, timeline: {
    setup: number[];
    tilt: number[];
    flow: number[];
    settle: number[];
}) {
    const deposited = progress(frame, [timeline.flow[0], timeline.flow[1]+4]);
    return {
        setup: progress(frame, timeline.setup),
        angle: config.pour_angle * progress(frame, timeline.tilt) * (1 - progress(frame, timeline.settle)),
        surface: lerp(config.initial_surface_y, config.final_surface_y, deposited),
        // The front travels down before volume begins to rise. Tail drains after source closes.
        front: progress(frame, [timeline.flow[0] - 3, timeline.flow[0]]),
        tail: progress(frame, [timeline.flow[1], timeline.flow[1] + 4]),
        deposited,
    };
}
