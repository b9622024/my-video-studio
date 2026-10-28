export type VisualEvent = {
  id: string;
  objectId: string;
  action: string;
  startFrame: number;
  endFrame: number;
  assetId?: string;
  narrationKeyword?: string;
  offsetFrames?: number;
  params?: Record<string, number | string>;
};
export const events: VisualEvent[] = [
  {id:'tilt',objectId:'carton',action:'lift-and-tilt',startFrame:4,endFrame:26,assetId:'original-atlas',params:{angle:67}},
  {id:'pour',objectId:'milk',action:'emit-ballistic-ribbon',startFrame:28,endFrame:82,assetId:'procedural-stylized-liquid',narrationKeyword:'倒入'},
  {id:'fill',objectId:'glass',action:'accumulate-arrival',startFrame:44,endFrame:98,params:{maximumFill:.63},narrationKeyword:'份量'},
  {id:'return',objectId:'carton',action:'return-to-surface',startFrame:82,endFrame:108},
  {id:'camera',objectId:'camera',action:'focus-glass',startFrame:78,endFrame:116,params:{scale:1.12,x:-190,y:-80}},
];
