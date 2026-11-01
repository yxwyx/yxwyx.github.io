/* Deterministic grid simulation; no DOM, timers, or storage. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory();
  else root.DNASnake=factory();
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  var SIZE=20,BASES='ATCG',VECTORS=[[0,-1],[1,0],[0,1],[-1,0]];
  function World(seed){
    this.seed=(seed>>>0)||1;this.direction=1;this.queue=[];this.state='playing';this.reason='';this.score=0;
    this.snake=BASES.split('').map(function(base,i){return {x:8-i,y:10,base:base};});
    this.food=this.spawn();
  }
  World.prototype.random=function(){this.seed=(Math.imul(1664525,this.seed)+1013904223)>>>0;return this.seed/4294967296;};
  World.prototype.spawn=function(){
    var occupied=new Set(this.snake.map(function(p){return p.y*SIZE+p.x;})),free=[];
    for(var i=0;i<SIZE*SIZE;i++)if(!occupied.has(i))free.push(i);
    if(!free.length)return null;
    var cell=free[Math.floor(this.random()*free.length)];
    return {x:cell%SIZE,y:Math.floor(cell/SIZE),base:BASES[Math.floor(this.random()*4)]};
  };
  World.prototype.turn=function(direction){
    if(this.state!=='playing'||!Number.isInteger(direction)||direction<0||direction>3||this.queue.length>=2)return false;
    var previous=this.queue.length?this.queue[this.queue.length-1]:this.direction;
    if(direction===previous||(direction+2)%4===previous)return false;
    this.queue.push(direction);return true;
  };
  World.prototype.interval=function(){return Math.max(75,170-Math.floor(this.score/50)*10);};
  World.prototype.tick=function(){
    if(this.state!=='playing')return;
    if(this.queue.length)this.direction=this.queue.shift();
    var v=VECTORS[this.direction],head=this.snake[0],x=head.x+v[0],y=head.y+v[1];
    var eating=this.food&&x===this.food.x&&y===this.food.y;
    // The tail vacates its square on non-growing moves.
    var occupied=this.snake.slice(0,eating?this.snake.length:-1);
    if(x<0||y<0||x>=SIZE||y>=SIZE||occupied.some(function(p){return p.x===x&&p.y===y;})){
      this.state='lost';this.reason=x<0||y<0||x>=SIZE||y>=SIZE?'WALL COLLISION':'SELF COLLISION';this.queue=[];return;
    }
    var old=this.snake;
    this.snake=old.map(function(p,i){var position=i?old[i-1]:{x:x,y:y};return {x:position.x,y:position.y,base:p.base};});
    if(eating){
      var tail=old[old.length-1];this.snake.push({x:tail.x,y:tail.y,base:this.food.base});this.score+=10;this.food=this.spawn();
      if(!this.food){this.state='won';this.reason='SEQUENCE COMPLETE';this.queue=[];}
    }
  };
  return {World:World,SIZE:SIZE};
});
