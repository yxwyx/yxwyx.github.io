/* DOM integration tests: dialog, canvas and animation frames are mocked. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),build=process.env.SITE_BUILD_DIR||path.join(root,'_site');
function boot(t,query=''){
  const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:'http://localhost/'+query,runScripts:'outside-only'});
  t.after(()=>dom.window.close());const w=dom.window,d=w.document;let frame,world;
  w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=function(){};
  w.HTMLCanvasElement.prototype.getContext=()=>new Proxy({},{get:()=>()=>{},set:()=>true});
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  w.requestAnimationFrame=fn=>{frame=fn;return 1;};w.cancelAnimationFrame=()=>{frame=null;};
  w.eval(fs.readFileSync(path.join(root,'assets/js/snake-engine.js'),'utf8'));
  const World=w.DNASnake.World;w.DNASnake.World=function(seed){world=new World(seed);return world;};
  for(const name of ['snake-game','portfolio-catalog','terminal-fs','terminal'])w.eval(fs.readFileSync(path.join(root,'assets/js/'+name+'.js'),'utf8'));
  const input=d.getElementById('command-input');
  return {w,d,input,world:()=>world,frame:time=>frame(time),tick:()=>new Promise(r=>w.setTimeout(r,10)),run(text){input.focus();input.value=text;input.dispatchEvent(new w.Event('input'));d.getElementById('command-form').dispatchEvent(new w.Event('submit',{cancelable:true,bubbles:true}));}};
}
test('games discovery, completion, snake command, pause, touch and Escape work without changing homepage shortcut',async t=>{
  const b=boot(t);assert.equal(b.d.querySelector('.snake-dialog'),null);assert.equal(b.d.querySelectorAll('.home-actions button').length,1);assert(b.d.getElementById('home-play-tank'));
  b.input.value='sna';b.input.dispatchEvent(new b.w.KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));assert.equal(b.input.value,'snake');
  b.run('games');assert.match(b.d.getElementById('transcript').textContent,/DNA Snake/);assert(b.d.querySelector('[data-command="snake"]'));
  b.run('snake');await b.tick();const game=b.d.querySelector('.snake-dialog');assert(game.open);assert.equal(b.world().state,'ready');
  game.querySelector('[aria-label="Start or resume DNA snake"]').click();assert.equal(b.world().state,'playing');assert.equal(b.d.activeElement.tagName,'CANVAS');
  const canvas=game.querySelector('canvas');canvas.dispatchEvent(new b.w.KeyboardEvent('keydown',{code:'KeyK',bubbles:true,cancelable:true}));
  b.frame(0);b.frame(180);assert.equal(b.world().snake[0].y,9);
  b.w.dispatchEvent(new b.w.Event('blur'));assert.equal(b.world().state,'paused');const before=JSON.stringify(b.world().snake);b.frame(10000);assert.equal(JSON.stringify(b.world().snake),before);
  game.querySelector('[aria-label="Start or resume DNA snake"]').click();assert.equal(b.world().state,'playing');
  game.querySelector('[aria-label="Steer left"]').click();b.frame(10001);b.frame(10181);assert.equal(b.world().snake[0].x,7);
  game.dispatchEvent(new b.w.Event('cancel',{cancelable:true}));assert.equal(game.open,false);assert.equal(b.d.activeElement,b.input);assert.equal(b.d.body.classList.contains('snake-open'),false);
  b.run('man snake');assert.match(b.d.getElementById('transcript').lastElementChild.textContent,/HJKL/);
  b.run('cat ~/games/snake.txt');assert.match(b.d.getElementById('transcript').lastElementChild.textContent,/DNA \/ SNAKE/);
});
test('deep link opens ready screen; loss, best score, restart and relaunch have clean state',async t=>{
  const b=boot(t,'?play=snake');await b.tick();const game=b.d.querySelector('.snake-dialog');assert(game.open);assert.equal(b.world().state,'ready');
  game.querySelector('[aria-label="Start or resume DNA snake"]').click();b.world().score=30;b.world().snake=[{x:19,y:0,base:'G'}];
  b.frame(0);b.frame(180);assert.equal(b.world().state,'lost');assert.match(game.querySelector('.snake-overlay h3').textContent,/WALL/);assert.equal(b.w.localStorage.getItem('yw-snake-best'),'30');
  game.querySelector('[aria-label="Restart DNA snake"]').click();assert.equal(b.world().score,0);assert.equal(b.world().snake.length,4);assert.equal(game.querySelector('.snake-overlay').hidden,true);
  game.querySelector('[aria-label="Exit DNA snake"]').click();b.w.openSnakeGame();assert.equal(b.world().state,'ready');assert.equal(b.d.querySelectorAll('.snake-dialog').length,1);
});
