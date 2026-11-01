const {test}=require('node:test');
const assert=require('node:assert/strict');
const {World,SIZE}=require('../assets/js/snake-engine.js');
const cell=(x,y,base='A')=>({x,y,base});
test('seeded food is reproducible, within the board and never on the snake',()=>{
  const a=new World(42),b=new World(42);
  for(let i=0;i<100;i++){
    const food=a.spawn();assert.deepEqual(food,b.spawn());
    assert(food.x>=0&&food.x<SIZE&&food.y>=0&&food.y<SIZE);
    assert(!a.snake.some(p=>p.x===food.x&&p.y===food.y));assert.match(food.base,/^[ATCG]$/);
  }
});
test('pickup appends its base, preserves the sequence and speeds up every five pickups',()=>{
  const w=new World(9),speed=w.interval();
  for(let i=0;i<5;i++){
    w.food=cell(w.snake[0].x+1,w.snake[0].y,'G');w.tick();
    assert.equal(w.snake.map(p=>p.base).join(''),'ATCG'+'G'.repeat(i+1));
    assert.equal(new Set(w.snake.map(p=>p.x+','+p.y)).size,w.snake.length);
  }
  assert.equal(w.score,50);assert(w.interval()<speed);assert.equal(w.snake.length,9);
  w.score=10000;assert.equal(w.interval(),75);
});
test('buffered turns cannot reverse direction and consume at most one turn per tick',()=>{
  const w=new World(3);assert.equal(w.turn(3),false);assert(w.turn(0));assert.equal(w.turn(2),false);assert(w.turn(3));assert.equal(w.turn(2),false);
  w.tick();assert.deepEqual([w.snake[0].x,w.snake[0].y],[8,9]);
  w.tick();assert.deepEqual([w.snake[0].x,w.snake[0].y],[7,9]);assert.equal(w.state,'playing');
});
test('wall and body collisions stop play; moving into the vacating tail is allowed',()=>{
  const wall=new World(1);wall.snake=[cell(19,0)];wall.tick();assert.equal(wall.state,'lost');assert.equal(wall.reason,'WALL COLLISION');
  const body=new World(1);body.snake=[cell(2,1),cell(1,1),cell(1,2),cell(2,2),cell(3,2)];body.direction=2;body.food=cell(9,9);body.tick();assert.equal(body.reason,'SELF COLLISION');
  const tail=new World(1);tail.snake=[cell(1,1),cell(1,2),cell(0,2),cell(0,1)];tail.direction=3;tail.food=cell(9,9);tail.tick();assert.equal(tail.state,'playing');assert.deepEqual(tail.snake[0],cell(0,1));
});
test('pausing freezes movement and input; filling the board wins without a spawn loop',()=>{
  const w=new World(1);w.state='paused';const before=JSON.stringify(w);assert.equal(w.turn(0),false);w.tick();assert.equal(JSON.stringify(w),before);
  w.state='playing';w.direction=3;w.snake=[cell(1,0)];
  for(let y=0;y<SIZE;y++)for(let x=0;x<SIZE;x++)if(!(y===0&&(x===0||x===1)))w.snake.push(cell(x,y));
  w.food=cell(0,0,'T');w.tick();assert.equal(w.snake.length,SIZE*SIZE);assert.equal(w.state,'won');assert.equal(w.food,null);
});
