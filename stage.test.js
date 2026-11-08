import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stageFrame} from './index.js';
const input={apiVersion:1,width:1200,height:650,position:1200,playing:true,mode:'aurora',accent:[80,170,230],bands:Array(24).fill(0.5),hasSpectrum:true,title:'测试歌曲',current:{text:'向光而行',start:0,end:3000,words:[{text:'向光',start:0,end:1500},{text:'而行',start:1500,end:3000}],translation:'Into the light'},next:{text:'下一句'}};
test('all modes stay within host budgets at narrow, HD and 4K sizes',()=>{
 for(const mode of ['cinema']) for(const [width,height] of [[360,180],[1200,650],[3840,1900]]) for(const position of [0,1500,4000,90000]) {
  const scene=stageFrame({...input,mode,width,height,position});
  assert.ok(scene.primitives.length<=384);
  assert.ok(scene.primitives.reduce((sum,n)=>sum+(n.points?.length||0),0)<=4096);
  for(const n of scene.primitives) for(const [key,value] of Object.entries(n)) if(typeof value==='number') assert.ok(Number.isFinite(value),key);
 }
});
test('seeking is deterministic and reduced motion removes word movement',()=>{
 assert.deepEqual(stageFrame(input),stageFrame(input));
 const runs=stageFrame({...input,reduceMotion:true}).primitives.flatMap(n=>n.runs||[]);
 assert.ok(runs.length>0);
 for(const run of runs){assert.equal(run.scale,1);assert.equal(run.rise,0);assert.equal(run.opacity,1);}
});
test('timed words reveal as sung and a previous line leaves after the transition',()=>{
 const words=x=>stageFrame(x).primitives.flatMap(n=>n.runs||[]);
 assert.ok(words({...input,position:1400})[1].opacity<words({...input,position:2200})[1].opacity);
 const previous={text:'A previous line',start:-3000,end:0,words:[{text:'A previous line',start:-3000,end:0}]};
 assert.ok(words({...input,previous,position:200}).some(x=>x.text===previous.text));
 assert.ok(!words({...input,previous,position:700}).some(x=>x.text===previous.text));
});
test('missing lyrics, long words and unsupported API are handled explicitly',()=>{
 assert.ok(stageFrame({...input,current:null,next:null}).primitives.some(n=>n.text===input.title));
 assert.ok(stageFrame({...input,current:{text:'长'.repeat(500),start:0,end:5000,words:[]}}).primitives.length<384);
 assert.throws(()=>stageFrame({...input,apiVersion:2}));
});
