// Stage API 1. Local native typography, without network or process permissions.
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const rgba=(rgb,alpha=1)=>[...rgb.map(x=>Math.round(clamp(x,0,255))),Math.round(clamp(alpha)*255)];
export function home() {
 return {title:"律动 Studio",subtitle:"电影字幕 · 高清原生文字 · 平滑换句",
 description:"需要本项目的 Stage API 1 适配版播放器；官方原版尚不支持。\n播放歌曲后，打开「律动」→「律动效果」→「律动 Studio · 电影字幕」。\n歌词来自当前音乐源。有逐词时间时按逐词时间展示；只有整句时间时，由播放器估算句内时间。\n没有歌词时显示歌名。本插件不联网补全歌词。"};
}
export function stageFrame(input) {
 if(input.apiVersion!==1)throw new Error("This plugin requires Stage API 1.");
 return cinemaFrame(input);
}

// Cinematic typography: the lyric is the composition. Native word measurement
// keeps punctuation and spaces correct; no scaled bitmap or blurred ink.
function cinemaFrame(input) {
  const w=input.width,h=input.height,position=input.position;
  const ink=[239,237,230], muted=[148,157,167], gold=[194,176,139];
  const primitives=[];
  const ease=x=>1-Math.pow(1-clamp(x),3);
  const text=(value,x,y,size,color,weight=400,align="left")=>{
    if(value)primitives.push({kind:"text",text:value,x,y,size,weight,align,color});
  };
  const line=(x,y,x2,y2,width,color)=>primitives.push({kind:"line",x,y,x2,y2,width,color});
  const left=w*0.12;
  const small=Math.max(10,Math.min(12,w*0.011));
  text("L Y R I C   /   C I N E M A",left,h*0.105,small,rgba(gold,0.68),500);
  text("N O W   P L A Y I N G",w-left,h*0.105,small,rgba(muted,0.5),400,"right");
  line(left,h*0.155,w-left,h*0.155,0.6,rgba(ink,0.1));

  const current=input.current;
  const active=current?.text && position>=current.start && position<=current.end+1600;
  const splitRows=source=>{
    const tokens=source.words?.length && source.words.length<100 ? source.words : [{text:source.text,start:source.start,end:source.end}];
    if(source.text.length<=33 || tokens.length<=3)return [tokens];
    const target=source.text.length/2;let count=0,cut=1,best=Infinity;
    for(let i=0;i<tokens.length-1;i++){count+=tokens[i].text.length;const score=Math.abs(count-target);if(score<best){best=score;cut=i+1;}}
    return [tokens.slice(0,cut),tokens.slice(cut)];
  };
  if(active && input.previous?.text && !input.reduceMotion && position-current.start<480) {
    const out=ease((position-current.start)/480),previous=input.previous;
    const rows=splitRows(previous),size=Math.min(w*(previous.text.length>62?0.048:0.057),h*0.118,82);
    rows.forEach((row,index)=>primitives.push({kind:"words",x:left,y:h*(rows.length===1?0.405:0.32)-out*46+index*size*1.35,size,weight:500,align:"left",
      runs:row.map(word=>({text:word.text,scale:1,opacity:(1-out)*0.6,rise:0,color:rgba(ink)}))}));
  }
  if(active) {
    const incoming=clamp((position-current.start)/850);
    const entry=input.reduceMotion?1:ease(incoming);
    const long=current.text.length>62;
    const size=Math.min(w*(long?0.048:0.057),h*0.118,82);
    // Break close to the middle of a long sentence; host uses exact font
    // metrics inside each row and fits it to the remaining width.
    const rows=splitRows(current);
    const camera=input.reduceMotion?0:Math.sin(clamp((position-current.start)/Math.max(1,current.end-current.start))*Math.PI)*3;
    const y=h*(rows.length===1?0.405:0.32)+(1-entry)*32-camera;
    rows.forEach((row,index)=>{
      const runs=row.map(word=>{
        const reveal=input.reduceMotion?1:ease((position-word.start+120)/480);
        const started=position>=word.start;
        const phase=clamp((position-word.start)/Math.max(100,word.end-word.start));
        return {text:word.text,scale:input.reduceMotion?1:1+0.012*Math.sin(phase*Math.PI),
          opacity:(0.18+0.82*reveal)*entry,rise:(1-reveal)*10,
          color:rgba(started?ink:muted)};
      });
      primitives.push({kind:"words",x:left,y:y+index*size*1.35,size,weight:500,align:"left",runs});
    });
    const translationY=y+rows.length*size*1.35+26;
    text(current.translation,left,Math.min(translationY,h*0.75),Math.min(20,w*0.018),rgba(muted,0.6*entry),400);
    const progress=clamp((position-current.start)/Math.max(1,current.end-current.start));
    line(left,h*0.84,left+w*0.12,h*0.84,0.8,rgba(ink,0.12));
    line(left,h*0.84,left+w*0.12*progress,h*0.84,1.2,rgba(gold,0.8));
  } else {
    const y=h*0.39;
    text(input.title || "Let the music speak.",left,y,Math.min(52,w*0.043),rgba(ink,0.9),500);
    text(input.next?.text ? "下一句，即将到来" : "暂无歌词",left,y+84,16,rgba(muted,0.5),400);
  }
  // The following line stays small, separate from the main lyric.
  text(input.title,left,h*0.91,Math.min(13,w*0.012),rgba(muted,0.42),400);
  const time=`${String(Math.floor(position/60000)).padStart(2,"0")}:${String(Math.floor(position/1000)%60).padStart(2,"0")}`;
  text(time,w-left,h*0.91,12,rgba(muted,0.42),400,"right");
  return {background:[13,16,21,255],primitives};
}
