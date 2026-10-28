import React from 'react';
import {AbsoluteFill,Img,staticFile,useCurrentFrame} from 'remotion';
import {PhotoFocus,ContextualAnnotation,PortionExplanation,between,palette} from './EditorialPrimitives';
export type VisualTestKind='B2'|'C2A'|'C2B';
type Props={kind:VisualTestKind;showText?:boolean};
const Header:React.FC<{kicker:string;children:React.ReactNode}>=({kicker,children})=><div style={{position:'absolute',left:36,top:43,color:palette.navy}}><div style={{fontSize:15,letterSpacing:3,marginBottom:15}}>{kicker}</div><div style={{fontSize:43,fontWeight:650,lineHeight:1.24,letterSpacing:1}}>{children}</div></div>;
const Footer:React.FC<{children:React.ReactNode}>=({children})=><div style={{position:'absolute',left:36,right:30,bottom:34,color:palette.muted,fontSize:16,lineHeight:1.7}}>{children}</div>;

export const EditorialVisualTest:React.FC<Props>=({kind,showText=true})=>{
 const f=useCurrentFrame(),p=between(f,18,48);
 return <AbsoluteFill style={{background:palette.paper,color:palette.navy,fontFamily:'"Noto Sans CJK TC",sans-serif',overflow:'hidden'}}>
  {kind==='B2'?<>
   {showText?<div style={{opacity:p}}><Header kicker="MEAL NOTES / 配菜觀察">先看整盤，<br/>再看蔬菜。</Header></div>:null}
   <PhotoFocus src="assets/a1-plate.jpg" from={{x:0,y:350,width:540,height:480}} to={{x:0,y:350,width:540,height:480}} range={[22,52]} position="45% 90%" reveal/>
   <PhotoFocus src="assets/a1-plate.jpg" from={{x:0,y:0,width:540,height:960}} to={{x:332,y:182,width:184,height:232}} range={[18,48]} position="50% 28%" border/>
   {showText?<>
    <ContextualAnnotation x={332} y={150} text="餐盤脈絡" visible={p} small/>
    <ContextualAnnotation x={30} y={799} text="蔬菜局部" visible={between(f,45,62)}/>
    <Footer>同一餐盤的不同觀察位置<br/>沒有補造、替換或增加食物。</Footer>
   </>:null}
  </>:kind==='C2A'?<>
   {showText?<Header kicker="PORTION STUDY / 餐具參照">先看容器，<br/>再看餐盤空間。</Header>:null}
   <PortionExplanation id="pure-"/>
   {showText?<Footer>不同容器，重新觀察。<br/>空餐具示意；不是食物份量或飲食建議。</Footer>:null}
  </>:<>
   {showText?<Header kicker="PORTION STUDY / 白飯影像提案">看得見食物，<br/>才有觀察的起點。</Header>:null}
   <div style={{position:'absolute',left:24,top:244,width:492,height:365,overflow:'hidden'}}>
    <Img src={staticFile('assets/c1-rice-proposal.jpg')} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'42% 50%',transform:`scale(${1+between(f,15,55)*.13})`,transformOrigin:'42% 50%'}}/>
   </div>
   <PortionExplanation compact id="photo-"/>
   {showText?<>
    <ContextualAnnotation x={32} y={577} text="熟白飯：局部觀察" visible={between(f,20,40)} small/>
    <Footer>白飯影像未改量；下方只作容器參照。<br/>C1 素材提案，尚未納入正式核准選擇。</Footer>
   </>:null}
  </>}
 </AbsoluteFill>;
};
