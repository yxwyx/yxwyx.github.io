/* DOM integration checks; canvas and browser dialogs are mocked, not visual QA. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const build=process.env.SITE_BUILD_DIR||path.join(root,'_site');
function boot(t,route=''){
  const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:'http://localhost/'+route,runScripts:'outside-only'});
  t.after(()=>dom.window.close());
  const w=dom.window,d=w.document;let frame,world;
  w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=function(){};
  w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{},set:()=>true});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.requestAnimationFrame=f=>{frame=f;return 1;};w.cancelAnimationFrame=()=>{frame=null;};
  w.eval(fs.readFileSync(path.join(root,'assets/js/tank-engine.js'),'utf8'));
  const World=w.TankEngine.World;
  w.TankEngine.World=function(seed){world=new World(seed);return world;};
  for(const name of ['tank-game','portfolio-catalog','terminal-fs','terminal'])w.eval(fs.readFileSync(path.join(root,'assets/js/'+name+'.js'),'utf8'));
  return {w,d,world:()=>world,frame:time=>frame(time),run(value){d.getElementById('command-input').value=value;d.getElementById('command-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}};
}
test('homepage launches only on request, Escape returns focus, terminal entry and clear toggle choices',t=>{
  const b=boot(t),choices=b.d.getElementById('home-actions'),play=b.d.getElementById('home-play-tank');
  assert.equal(choices.hidden,false);assert.equal(b.d.querySelector('.tank-dialog'),null);
  play.focus();play.click();
  const game=b.d.querySelector('.tank-dialog');assert(game.open);assert.equal(b.world().state,'playing');
  assert(game.querySelector('.tank-overlay').hidden);assert.equal(b.d.activeElement.tagName,'CANVAS');
  b.frame(100);b.w.dispatchEvent(new b.w.Event('blur'));assert.equal(b.world().state,'paused');
  game.dispatchEvent(new b.w.Event('cancel',{cancelable:true}));assert.equal(game.open,false);assert.equal(b.d.activeElement,play);
  assert.equal(b.d.getElementById('transcript').children.length,0);
  b.run('help');assert(choices.hidden);assert.match(b.d.getElementById('transcript').textContent,/Background & teaching/);
  b.run('clear');assert.equal(choices.hidden,false);assert.equal(b.d.getElementById('transcript').children.length,0);
});
test('victory reveals research links, restart and loss remove reward, command launch keeps ready screen',t=>{
  const b=boot(t);b.d.getElementById('home-play-tank').click();const game=b.d.querySelector('.tank-dialog'),reward=game.querySelector('.tank-reward');
  assert(reward.hidden);
  // Isolate the UI transition; deterministic engine tests cover the win mechanics.
  b.world().step=function(){this.state='won';this.reason='SECTOR CLEARED';this.kills=this.total;};b.frame(100);
  assert.equal(reward.hidden,false);assert.match(reward.textContent,/RESEARCH ACCESS GRANTED/);
  assert.deepEqual(Array.from(reward.querySelectorAll('a'),a=>a.getAttribute('href')),['/research.html','/publications.html']);
  game.querySelector('[aria-label="Restart game"]').click();assert(reward.hidden);assert.equal(b.world().state,'playing');
  b.world().step=function(){this.state='lost';this.reason='BASE DESTROYED';};b.frame(200);assert(reward.hidden);
  game.dispatchEvent(new b.w.Event('cancel',{cancelable:true}));b.w.openTankGame();
  assert.equal(b.world().state,'ready');assert.equal(game.querySelector('.tank-overlay').hidden,false);assert(reward.hidden);
  assert.equal(b.d.querySelectorAll('.tank-dialog').length,1);
});
test('deep links bypass the homepage choices',t=>{
  const b=boot(t,'#about');assert(b.d.getElementById('home-actions').hidden);assert(b.d.getElementById('transcript').children.length>0);
});
