(function(){
  'use strict';
  var dialog,canvas,ctx,world,overlay,title,detail,startButton,pauseButton,previousFocus,raf=0,last=null,elapsed=0,best=0;
  var hud={},sequence,status;
  var colors={A:'#9fdbab',T:'#e9be78',C:'#91bfe7',G:'#d7a4d8'};
  var directions={ArrowUp:0,KeyW:0,KeyK:0,ArrowRight:1,KeyD:1,KeyL:1,ArrowDown:2,KeyS:2,KeyJ:2,ArrowLeft:3,KeyA:3,KeyH:3};
  function node(tag,text,cls){var n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
  function button(text,label,fn){var b=node('button',text);b.type='button';b.setAttribute('aria-label',label);b.addEventListener('click',fn);return b;}
  function save(){if(world.score>best){best=world.score;try{localStorage.setItem('yw-snake-best',String(best));}catch(e){}}}
  function show(titleText,description,action){title.textContent=titleText;detail.textContent=description;startButton.textContent=action;overlay.hidden=false;status.textContent=titleText+'. '+description;}
  function start(){world=new DNASnake.World(Date.now());elapsed=0;last=null;overlay.hidden=true;pauseButton.disabled=false;pauseButton.textContent='Pause';status.textContent='Playing. Collect bases; avoid walls and your own sequence.';draw();canvas.focus();}
  function pause(){
    if(world.state==='playing'){world.state='paused';world.queue=[];show('PAUSED','Your sequence can wait.','Resume');pauseButton.textContent='Resume';}
    else if(world.state==='paused'){world.state='playing';last=null;elapsed=0;overlay.hidden=true;pauseButton.textContent='Pause';status.textContent='Playing.';canvas.focus();}
  }
  function close(){if(dialog.open){save();dialog.close();}}
  function build(){
    dialog=node('dialog',null,'snake-dialog');dialog.setAttribute('aria-labelledby','snake-title');
    var header=node('header',null,'snake-header'),name=node('div');name.append(node('span','YW/OS · SEQUENCE ARCADE','snake-kicker'));
    var heading=node('h2','DNA / SNAKE');heading.id='snake-title';name.append(heading);header.append(name,button('Esc ×','Exit DNA snake',close));dialog.append(header);
    var stats=node('div',null,'snake-hud');[['score','SCORE'],['length','BASES'],['next','NEXT'],['best','BEST']].forEach(function(p){var cell=node('div');cell.append(node('span',p[1]));hud[p[0]]=node('strong','0');cell.append(hud[p[0]]);stats.append(cell);});dialog.append(stats);
    var stage=node('div',null,'snake-stage');canvas=node('canvas');canvas.width=canvas.height=400;canvas.tabIndex=0;canvas.setAttribute('aria-label','DNA snake board. Arrow keys, W A S D or H J K L steer. P pauses; Escape exits.');canvas.setAttribute('aria-describedby','snake-instructions');canvas.textContent='DNA Snake requires canvas support.';ctx=canvas.getContext('2d');stage.append(canvas);
    overlay=node('div',null,'snake-overlay');title=node('h3');detail=node('p');startButton=button('Start','Start or resume DNA snake',function(){if(world.state==='paused')pause();else start();});overlay.append(title,detail,startButton);stage.append(overlay);dialog.append(stage);
    var readout=node('div',null,'snake-sequence');readout.append(node('span','5′ → 3′'));sequence=node('code');readout.append(sequence);dialog.append(readout);
    var instructions=node('p','↑↓←→ / WASD / HJKL steer · P pause · Esc exit','snake-instructions');instructions.id='snake-instructions';dialog.append(instructions);
    var controls=node('div',null,'snake-controls'),dpad=node('div',null,'snake-dpad');
    [['up','↑',0],['left','←',3],['down','↓',2],['right','→',1]].forEach(function(p){var b=button(p[1],'Steer '+p[0],function(){world.turn(p[2]);canvas.focus({preventScroll:true});});b.className='snake-pad-'+p[0];dpad.append(b);});
    var actions=node('div',null,'snake-actions');pauseButton=button('Pause','Pause or resume DNA snake',pause);actions.append(pauseButton,button('Restart','Restart DNA snake',start));controls.append(dpad,actions);dialog.append(controls);
    dialog.append(node('p','Collect A · T · C · G. Grow your sequence. Avoid walls and yourself.','snake-objective'));
    status=node('p',null,'sr-only');status.setAttribute('role','status');dialog.append(status);document.body.append(dialog);
    dialog.addEventListener('keydown',function(e){
      if(e.isComposing||e.ctrlKey||e.metaKey||e.altKey)return;
      if(Object.prototype.hasOwnProperty.call(directions,e.code)){e.preventDefault();if(!e.repeat)world.turn(directions[e.code]);}
      else if(e.code==='KeyP'||(e.code==='Space'&&e.target===canvas)){e.preventDefault();if(!e.repeat)pause();}
    });
    dialog.addEventListener('cancel',function(e){e.preventDefault();close();});
    dialog.addEventListener('close',function(){cancelAnimationFrame(raf);raf=0;world.queue=[];document.body.classList.remove('snake-open');if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});});
    window.addEventListener('blur',function(){if(dialog.open&&world.state==='playing')pause();});
    document.addEventListener('visibilitychange',function(){if(document.hidden&&dialog.open&&world.state==='playing')pause();});
    var origin=null;
    canvas.addEventListener('pointerdown',function(e){origin={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);});
    canvas.addEventListener('pointerup',function(e){if(!origin)return;var dx=e.clientX-origin.x,dy=e.clientY-origin.y;origin=null;if(Math.max(Math.abs(dx),Math.abs(dy))<15)return;world.turn(Math.abs(dx)>Math.abs(dy)?(dx>0?1:3):(dy>0?2:0));});
    canvas.addEventListener('pointercancel',function(){origin=null;});
  }
  function draw(){
    ctx.fillStyle='#101815';ctx.fillRect(0,0,400,400);
    ctx.fillStyle='#24332a';for(var y=0;y<20;y++)for(var x=0;x<20;x++)ctx.fillRect(x*20+9,y*20+9,2,2);
    ctx.font='bold 14px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    if(world.food){var f=world.food;ctx.fillStyle=colors[f.base];ctx.fillRect(f.x*20+1,f.y*20+1,18,18);ctx.fillStyle='#101815';ctx.fillText(f.base,f.x*20+10,f.y*20+11);}
    world.snake.forEach(function(p,i){ctx.fillStyle=i===0?'#334c3d':'#192c21';ctx.fillRect(p.x*20+1,p.y*20+1,18,18);ctx.fillStyle=colors[p.base];ctx.fillText(p.base,p.x*20+10,p.y*20+11);if(i===0){ctx.strokeStyle='#d5efcc';ctx.lineWidth=1;ctx.strokeRect(p.x*20+.5,p.y*20+.5,19,19);}});
    var values={score:world.score,length:world.snake.length,next:world.food?world.food.base:'—',best:Math.max(best,world.score)};
    Object.keys(values).forEach(function(k){hud[k].textContent=String(values[k]);});
    var letters=world.snake.map(function(p){return p.base;}).join('');sequence.textContent=letters.length>36?'…'+letters.slice(-36):letters;
  }
  function frame(time){
    if(!dialog.open)return;
    if(last!==null&&world.state==='playing'){
      elapsed+=Math.min(250,Math.max(0,time-last));
      while(elapsed>=world.interval()&&world.state==='playing'){elapsed-=world.interval();world.tick();}
      draw();
      if(world.state==='lost'||world.state==='won'){save();pauseButton.disabled=true;show(world.reason,world.snake.length+' bases · '+world.score+' points. '+(world.state==='won'?'Every cell sequenced.':'Try another sequence.'),'Play again');startButton.focus({preventScroll:true});}
    }
    last=time;raf=requestAnimationFrame(frame);
  }
  window.openSnakeGame=function(){
    if(!dialog)build();if(dialog.open)return;
    previousFocus=document.activeElement;
    try{best=Math.max(0,parseInt(localStorage.getItem('yw-snake-best'),10)||0);}catch(e){}
    world=new DNASnake.World(Date.now());world.state='ready';elapsed=0;last=null;
    dialog.showModal();document.body.classList.add('snake-open');pauseButton.disabled=true;pauseButton.textContent='Pause';
    show('BUILD YOUR SEQUENCE','Collect bases. Every five pickups, a little faster.','Start sequencing');draw();startButton.focus();raf=requestAnimationFrame(frame);
  };
})();
