/* Deterministic simulation, independent of the canvas and browser controls. */
(function(root){
  'use strict';
  var SIZE=416,TILE=32,RADIUS=12;
  var dirs=[[0,-1],[1,0],[0,1],[-1,0]];
  function overlap(a,b,pad){return Math.abs(a.x-b.x)<(a.r||RADIUS)+(b.r||RADIUS)+(pad||0)&&Math.abs(a.y-b.y)<(a.r||RADIUS)+(b.r||RADIUS)+(pad||0);}
  function World(seed){this.seed=(seed||1)>>>0;this.reset();}
  World.prototype.random=function(){this.seed=(1664525*this.seed+1013904223)>>>0;return this.seed/4294967296;};
  World.prototype.reset=function(){
    this.grid=Array.from({length:13},function(){return Array(13).fill(0);});
    for(var y=1;y<=3;y++)for(var x=1;x<=11;x+=2)this.grid[y][x]=(y===2&&(x===3||x===9))?2:1;
    [[0,5],[1,5],[3,5],[4,5],[8,5],[9,5],[11,5],[12,5],[3,6],[6,6],[9,6],[1,8],[2,8],[4,8],[8,8],[10,8],[11,8],[1,9],[4,9],[8,9],[11,9],[5,11],[6,11],[7,11],[5,12],[7,12]].forEach(function(p){this.grid[p[1]][p[0]]=(p[1]===6)?2:1;},this);
    this.player={x:144,y:400,r:RADIUS,dir:0,cooldown:0,shield:2};
    this.base={x:208,y:400,r:14};this.enemies=[];this.bullets=[];this.effects=[];
    this.score=0;this.kills=0;this.lives=3;this.spawned=0;this.total=18;this.spawnTimer=.8;this.state='playing';this.reason='';this.elapsed=0;
  };
  World.prototype.blocked=function(x,y,tank){
    if(x<RADIUS||y<RADIUS||x>SIZE-RADIUS||y>SIZE-RADIUS)return true;
    var minX=Math.floor((x-RADIUS+.01)/TILE),maxX=Math.floor((x+RADIUS-.01)/TILE),minY=Math.floor((y-RADIUS+.01)/TILE),maxY=Math.floor((y+RADIUS-.01)/TILE);
    for(var row=minY;row<=maxY;row++)for(var col=minX;col<=maxX;col++)if(this.grid[row][col])return true;
    var box={x:x,y:y,r:RADIUS};if(overlap(box,this.base))return true;
    var all=[this.player].concat(this.enemies);return all.some(function(t){return t!==tank&&overlap(box,t);});
  };
  World.prototype.move=function(tank,dir,distance){tank.dir=dir;var d=dirs[dir],x=tank.x+d[0]*distance,y=tank.y+d[1]*distance;if(this.blocked(x,y,tank))return false;tank.x=x;tank.y=y;return true;};
  World.prototype.fire=function(tank,enemy){if(tank.cooldown>0)return;var d=dirs[tank.dir];this.bullets.push({x:tank.x+d[0]*16,y:tank.y+d[1]*16,dx:d[0],dy:d[1],enemy:enemy,r:3,dead:false});tank.cooldown = enemy ? 0.85 + this.random() * 0.6 : 0.27;};
  World.prototype.burst=function(x,y,color){this.effects.push({x:x,y:y,time:.3,color:color});};
  World.prototype.finish=function(state,reason){this.state=state;this.reason=reason;};
  World.prototype.spawn=function(){
    var points=[16,208,400],start=Math.floor(this.random()*3),wave=1+Math.floor(this.spawned/6);
    for(var i=0;i<3;i++){var enemy={x:points[(start+i)%3],y:16,r:RADIUS,dir:2,cooldown:.65,turn:.8,hp:wave===3?2:1,speed:34+wave*5};
      if(!this.blocked(enemy.x,enemy.y,enemy)){this.enemies.push(enemy);this.spawned++;return true;}}
    return false;
  };
  World.prototype.step=function(dt,controls){
    if(this.state!=='playing')return;dt=Math.max(0,Math.min(.1,dt));
    while(dt>0&&this.state==='playing'){var slice=Math.min(dt,1/120);this.tick(slice,controls||{});dt-=slice;}
  };
  World.prototype.tick=function(dt,c){
    this.elapsed+=dt;this.player.cooldown=Math.max(0,this.player.cooldown-dt);this.player.shield=Math.max(0,this.player.shield-dt);
    if(c.dir>=0&&c.dir<4)this.move(this.player,c.dir,92*dt);
    if(c.fire)this.fire(this.player,false);
    this.spawnTimer-=dt;
    if(this.spawnTimer<=0&&this.spawned<this.total&&this.enemies.length<4){this.spawnTimer=this.spawn()?1.9:.3;}
    this.enemies.forEach(function(e){
      e.cooldown-=dt;e.turn-=dt;
      if(e.turn<=0){e.dir=this.random()<.5?2:Math.floor(this.random()*4);e.turn=.6+this.random()*1.2;}
      if(!this.move(e,e.dir,e.speed*dt)){e.turn=0;}
      if(e.cooldown<=0)this.fire(e,true);
    },this);
    this.bullets.forEach(function(b){
      if(b.dead||this.state!=='playing')return;
      b.x+=b.dx*(b.enemy?180:250)*dt;b.y+=b.dy*(b.enemy?180:250)*dt;
      if(b.x<0||b.y<0||b.x>=SIZE||b.y>=SIZE){b.dead=true;return;}
      var col=Math.floor(b.x/TILE),row=Math.floor(b.y/TILE),tile=this.grid[row][col];
      if(tile){if(tile===1){this.grid[row][col]=0;this.burst(b.x,b.y,'#b36d4a');}b.dead=true;return;}
      if(overlap(b,this.base)){b.dead=true;if(b.enemy){this.burst(this.base.x,this.base.y,'#ef8d64');this.finish('lost','BASE DESTROYED');}return;}
      if(b.enemy){
        if(overlap(b,this.player)){b.dead=true;if(this.player.shield<=0){this.lives--;this.burst(this.player.x,this.player.y,'#edc879');if(this.lives<=0)this.finish('lost','OUT OF LIVES');else{this.player.x=144;this.player.y=400;this.player.dir=0;this.player.shield=2;}}}
      }else{
        for(var i=0;i<this.enemies.length;i++){var e=this.enemies[i];if(e.hp>0&&overlap(b,e)){b.dead=true;e.hp--;if(e.hp===0){this.kills++;this.score+=100;this.burst(e.x,e.y,'#ef8d64');}break;}}
      }
    },this);
    // Opposing shots cancel each other, giving the player a way to intercept fire.
    for(var i=0;i<this.bullets.length;i++)for(var j=i+1;j<this.bullets.length;j++){var a=this.bullets[i],b=this.bullets[j];if(!a.dead&&!b.dead&&a.enemy!==b.enemy&&overlap(a,b)){a.dead=b.dead=true;}}
    this.enemies=this.enemies.filter(function(e){return e.hp>0;});this.bullets=this.bullets.filter(function(b){return !b.dead;});
    this.effects.forEach(function(e){e.time-=dt;});this.effects=this.effects.filter(function(e){return e.time>0;});
    if(this.state==='playing'&&this.kills===this.total)this.finish('won','BASE SECURED');
  };
  var api={World:World,SIZE:SIZE,TILE:TILE};
  if(typeof module==='object'&&module.exports)module.exports=api;else root.TankEngine=api;
})(typeof window!=='undefined'?window:globalThis);
