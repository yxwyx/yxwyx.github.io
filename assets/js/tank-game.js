(function(){
  'use strict';
  var dialog,canvas,ctx,world,raf=0,last=0,keys=new Set(),touch=new Set(),best=0,previousFocus;
  var hud={},overlay,message,startButton,pauseButton,reward;
  var moveKeys={ArrowUp:0,KeyW:0,ArrowRight:1,KeyD:1,ArrowDown:2,KeyS:2,ArrowLeft:3,KeyA:3};
  function node(tag,text,cls){var n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
  function button(text,label,action){var b=node('button',text);b.type='button';b.setAttribute('aria-label',label);b.addEventListener('click',action);return b;}
  function resetInput(){keys.clear();touch.clear();if(dialog)dialog.querySelectorAll('[data-control]').forEach(function(b){b.classList.remove('is-held');});}
  function saveBest(){if(world.score>best){best=world.score;try{localStorage.setItem('yw-tank-best',String(best));}catch(e){}}}
  function setOverlay(title,detail,action){message.textContent=title;overlay.querySelector('p').textContent=detail;startButton.textContent=action;reward.hidden=true;overlay.hidden=false;}
  function start(){world=new TankEngine.World(Date.now());resetInput();overlay.hidden=true;reward.hidden=true;pauseButton.textContent='Pause';pauseButton.disabled=false;last=0;canvas.focus();}
  function pause(){
    resetInput();
    if(world.state==='playing'){world.state='paused';setOverlay('PAUSED','Take a breath. Your base is waiting.','Resume');pauseButton.textContent='Resume';}
    else if(world.state==='paused'){world.state='playing';overlay.hidden=true;pauseButton.textContent='Pause';last=0;canvas.focus();}
  }
  function close(){if(!dialog.open)return;saveBest();dialog.close();}
  function build(){
    dialog=node('dialog',null,'tank-dialog');dialog.setAttribute('aria-labelledby','tank-title');
    var header=node('header',null,'tank-header');
    var name=node('div');name.append(node('span','YW/OS · ARCADE MODULE','tank-kicker'));var title=node('h2','TANK / BASE DEFENSE');title.id='tank-title';name.append(title);header.append(name);
    header.append(button('Esc ×','Exit tank game',close));dialog.append(header);
    var stats=node('div',null,'tank-hud');[['score','SCORE'],['lives','LIVES'],['remaining','HOSTILES'],['best','BEST']].forEach(function(p){var s=node('div');s.append(node('span',p[1]));hud[p[0]]=node('strong','0');s.append(hud[p[0]]);stats.append(s);});dialog.append(stats);
    var stage=node('div',null,'tank-stage');canvas=node('canvas');canvas.width=canvas.height=TankEngine.SIZE;canvas.tabIndex=0;canvas.setAttribute('aria-label','Tank battlefield. Move with arrow keys or W A S D; Space or J fires; P pauses; Escape exits.');canvas.setAttribute('aria-describedby','tank-instructions');canvas.textContent='This game requires a browser with canvas support.';stage.append(canvas);ctx=canvas.getContext('2d');
    overlay=node('div',null,'tank-overlay');message=node('h3');overlay.append(message,node('p'));startButton=button('Start game','Start or resume tank game',function(){if(world.state==='paused')pause();else start();});overlay.append(startButton);stage.append(overlay);dialog.append(stage);
    reward=node('div',null,'tank-reward');reward.hidden=true;
    reward.append(node('p','RESEARCH ACCESS GRANTED'));
    [['Explore research','/research.html'],['Read papers','/publications.html']].forEach(function(item){var a=node('a',item[0]);a.href=item[1];reward.append(a);});overlay.append(reward);
    var instructions=node('p','WASD / ↑↓←→ move · SPACE / J fire · P pause','tank-instructions');instructions.id='tank-instructions';dialog.append(instructions);
    var controls=node('div',null,'tank-controls'),dpad=node('div',null,'tank-dpad');
    [['up','↑',0],['left','←',3],['down','↓',2],['right','→',1]].forEach(function(p){var b=node('button',p[1],'pad-'+p[0]);b.type='button';b.dataset.control=String(p[2]);b.setAttribute('aria-label','Move '+p[0]);hold(b,p[2]);dpad.append(b);});controls.append(dpad);
    var fire=node('button','FIRE','tank-fire');fire.type='button';fire.dataset.control='fire';fire.setAttribute('aria-label','Fire tank cannon');hold(fire,'fire');controls.append(fire);
    var actions=node('div',null,'tank-actions');pauseButton=button('Pause','Pause or resume game',pause);actions.append(pauseButton,button('Restart','Restart game',start));controls.append(actions);dialog.append(controls);
    var hint=node('p','Protect the base. Break brick walls. Steel blocks shots. Defeat all 18 tanks.','tank-objective');dialog.append(hint);document.body.append(dialog);
    dialog.addEventListener('keydown',function(e){
      if(Object.prototype.hasOwnProperty.call(moveKeys,e.code)||e.code==='Space'||e.code==='KeyJ'){
        // Preserve normal keyboard activation of Start/Pause/Exit buttons.
        if(e.target.tagName==='BUTTON'&&e.code==='Space')return;
        e.preventDefault();keys.add(e.code);
      }else if(e.code==='KeyP'){e.preventDefault();if(!e.repeat)pause();}
    });
    dialog.addEventListener('keyup',function(e){keys.delete(e.code);});
    dialog.addEventListener('cancel',function(e){e.preventDefault();close();});
    dialog.addEventListener('close',function(){cancelAnimationFrame(raf);raf=0;resetInput();document.body.classList.remove('tank-open');if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});});
    window.addEventListener('blur',function(){if(dialog.open&&world.state==='playing')pause();});
    document.addEventListener('visibilitychange',function(){if(document.hidden&&dialog.open&&world.state==='playing')pause();});
  }
  function hold(b,value){
    b.addEventListener('pointerdown',function(e){e.preventDefault();b.setPointerCapture(e.pointerId);touch.add(value);b.classList.add('is-held');});
    function release(){touch.delete(value);b.classList.remove('is-held');}
    b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
    // Touch buttons also work with keyboard focus and Space/Enter.
    b.addEventListener('keydown',function(e){if(e.code==='Space'||e.code==='Enter'){e.preventDefault();e.stopPropagation();touch.add(value);b.classList.add('is-held');}});
    b.addEventListener('keyup',function(e){if(e.code==='Space'||e.code==='Enter'){e.preventDefault();e.stopPropagation();release();}});b.addEventListener('blur',release);
  }
  function tank(t,color){
    ctx.save();ctx.translate(Math.round(t.x),Math.round(t.y));ctx.rotate(t.dir*Math.PI/2);
    ctx.fillStyle='#252d2b';ctx.fillRect(-12,-12,6,24);ctx.fillRect(6,-12,6,24);
    ctx.fillStyle=color;for(var y=-10;y<12;y+=6){ctx.fillRect(-11,y,4,3);ctx.fillRect(7,y,4,3);}
    ctx.fillRect(-6,-10,12,20);ctx.fillStyle='#101719';ctx.fillRect(-4,-5,8,10);ctx.fillStyle=color;ctx.fillRect(-3,-4,6,8);ctx.fillRect(-2,-17,4,15);ctx.fillStyle='#fff7ce';ctx.fillRect(-2,-4,2,2);ctx.restore();
  }
  function draw(){
    ctx.imageSmoothingEnabled=false;ctx.fillStyle='#101719';ctx.fillRect(0,0,416,416);
    ctx.fillStyle='#1a2324';for(var y=0;y<416;y+=16)for(var x=0;x<416;x+=16)ctx.fillRect(x,y,1,1);
    world.grid.forEach(function(row,y){row.forEach(function(tile,x){if(!tile)return;var px=x*32,py=y*32;
      if(tile===1){ctx.fillStyle='#a66a46';ctx.fillRect(px+1,py+1,30,30);ctx.fillStyle='#60452f';for(var j=0;j<4;j++){ctx.fillRect(px,py+j*8,32,2);ctx.fillRect(px+(j%2?8:16),py+j*8,2,8);}ctx.fillStyle='#c38a58';ctx.fillRect(px+2,py+2,13,2);}
      else{ctx.fillStyle='#53676c';ctx.fillRect(px+1,py+1,30,30);ctx.fillStyle='#829193';ctx.fillRect(px+2,py+2,28,3);ctx.fillRect(px+2,py+2,3,28);ctx.fillStyle='#293c42';ctx.fillRect(px+8,py+8,16,16);ctx.fillStyle='#75878a';ctx.fillRect(px+12,py+12,8,8);}
    });});
    // Original pixel beacon marks the defended base.
    ctx.fillStyle=world.reason==='BASE DESTROYED'?'#6e3c36':'#739c7c';ctx.fillRect(195,388,26,26);ctx.fillStyle='#152822';ctx.fillRect(199,392,18,18);ctx.fillStyle='#c6e7b2';ctx.fillRect(206,394,4,14);ctx.fillRect(201,399,14,4);
    world.enemies.forEach(function(e){tank(e,e.hp>1?'#9baeb0':'#d18569');});
    if(world.state!=='lost'||world.lives>0)tank(world.player,'#edc879');
    if(world.player.shield>0){ctx.strokeStyle='#f8e5a2';ctx.lineWidth=1;ctx.strokeRect(Math.round(world.player.x)-15,Math.round(world.player.y)-15,30,30);}
    world.bullets.forEach(function(b){ctx.fillStyle=b.enemy?'#f29d75':'#ffefaa';ctx.fillRect(Math.round(b.x)-2,Math.round(b.y)-2,4,4);});
    world.effects.forEach(function(e){var r=(.3-e.time)*45;ctx.fillStyle=e.color;for(var i=0;i<8;i++){var a=i*Math.PI/4;ctx.fillRect(Math.round(e.x+Math.cos(a)*r)-2,Math.round(e.y+Math.sin(a)*r)-2,4,4);}});
    var values={score:String(world.score).padStart(4,'0'),lives:world.lives,remaining:world.total-world.kills,best:String(Math.max(best,world.score)).padStart(4,'0')};Object.keys(values).forEach(function(k){if(hud[k].textContent!==String(values[k]))hud[k].textContent=values[k];});
  }
  function frame(time){
    if(!dialog.open)return;
    var direction=-1;keys.forEach(function(k){if(moveKeys[k]!==undefined)direction=moveKeys[k];});touch.forEach(function(k){if(typeof k==='number')direction=k;});
    var old=world.state;world.step(last?(time-last)/1000:0,{dir:direction,fire:keys.has('Space')||keys.has('KeyJ')||touch.has('fire')});last=time;draw();
    if(old==='playing'&&(world.state==='lost'||world.state==='won')){saveBest();resetInput();pauseButton.disabled=true;setOverlay(world.reason,'SCORE '+world.score+' · '+world.kills+' / '+world.total+' hostiles cleared','Play again');reward.hidden=world.state!=='won';startButton.focus({preventScroll:true});}
    raf=requestAnimationFrame(frame);
  }
  window.openTankGame=function(options){
    if(!dialog)build();if(dialog.open)return;
    previousFocus=document.activeElement;if(previousFocus)previousFocus.blur();
    try{best=Math.max(0,parseInt(localStorage.getItem('yw-tank-best'),10)||0);}catch(e){}
    world=new TankEngine.World(Date.now());world.state='ready';resetInput();last=0;
    dialog.showModal();document.body.classList.add('tank-open');pauseButton.disabled=true;
    setOverlay('TANK / BASE DEFENSE','One base. Three lives. Eighteen reasons to keep moving.','Start game');
    if(options&&options.start)start();else startButton.focus();
    draw();raf=requestAnimationFrame(frame);
  };
})();
