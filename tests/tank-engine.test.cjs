const test = require('node:test');
const assert = require('node:assert/strict');
const {World} = require('../assets/js/tank-engine.js');
function bullet(x,y,dy,enemy){return {x,y,dx:0,dy,enemy,r:3,dead:false};}
function clear(world){world.grid=world.grid.map(row=>row.map(()=>0));}
function enemy(world){const e={x:80,y:80,r:12,dir:2,cooldown:10,turn:10,hp:1,speed:0};world.enemies=[e];return e;}

test('seeded simulation is reproducible and never spawns overlapping tanks',()=>{
 const a=new World(42),b=new World(42);
 for(let i=0;i<1200;i++){const c={dir:i%4,fire:i%5===0};a.step(1/60,c);b.step(1/60,c);}
 assert.equal(JSON.stringify(a),JSON.stringify(b));
 const w=new World(9);w.spawn();w.spawn();w.spawn();assert.equal(w.enemies.length,3);assert.equal(w.spawn(),false);
});
test('walls stop movement and bullets break brick but not steel',()=>{
 const w=new World(1);w.player.x=80;w.player.y=112;
 assert.equal(w.move(w.player,1,5),false);assert.equal(w.player.x,80);
 w.bullets=[bullet(48,30,1,false)];w.step(.03,{});assert.equal(w.grid[1][1],0);assert.equal(w.bullets.length,0);
 w.bullets=[bullet(112,62,1,false)];w.step(.03,{});assert.equal(w.grid[2][3],2);assert.equal(w.bullets.length,0);
});
test('player shots score exactly once when destroying an enemy',()=>{
 const w=new World(2);clear(w);enemy(w);w.bullets=[bullet(80,100,-1,false),bullet(80,101,-1,false)];w.step(.08,{});
 assert.equal(w.kills,1);assert.equal(w.score,100);assert.equal(w.enemies.length,0);
});
test('damage consumes a life, respawn shield blocks repeated damage, exhaustion ends game',()=>{
 const w=new World(3);clear(w);w.player.shield=0;
 w.bullets=[bullet(144,380,1,true)];w.step(.08,{});assert.equal(w.lives,2);assert(w.player.shield>1);
 w.bullets=[bullet(144,380,1,true)];w.step(.08,{});assert.equal(w.lives,2);
 w.lives=1;w.player.shield=0;w.bullets=[bullet(144,380,1,true)];w.step(.08,{});assert.equal(w.state,'lost');assert.equal(w.reason,'OUT OF LIVES');
});
test('base destruction ends the game; friendly shots cannot destroy it',()=>{
 const w=new World(4);w.bullets=[bullet(208,386,1,false)];w.step(.03,{});assert.equal(w.state,'playing');
 w.bullets=[bullet(208,386,1,true)];w.step(.03,{});assert.equal(w.state,'lost');assert.equal(w.reason,'BASE DESTROYED');
});
test('clearing the final enemy wins, and restart restores the level',()=>{
 const w=new World(5);clear(w);enemy(w);w.kills=17;w.spawned=18;w.bullets=[bullet(80,100,-1,false)];w.step(.08,{});assert.equal(w.state,'won');
 w.reset();assert.equal(w.state,'playing');assert.equal(w.kills,0);assert.equal(w.lives,3);assert.equal(w.grid[1][1],1);
});
test('paused simulation freezes; projectiles expire outside battlefield',()=>{
 const w=new World(6);w.state='paused';const before=JSON.stringify(w);w.step(.1,{dir:0,fire:true});assert.equal(JSON.stringify(w),before);
 w.state='playing';w.bullets=[bullet(16,1,-1,false)];w.step(.03,{});assert.equal(w.bullets.length,0);
});
