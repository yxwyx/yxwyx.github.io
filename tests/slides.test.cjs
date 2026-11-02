const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const source=fs.readFileSync(path.join(__dirname,'../assets/slides/ai-workflow-slides.html'),'utf8');
function boot(t,hash=''){
 const dom=new JSDOM(source,{url:'http://localhost/assets/slides/ai-workflow-slides.html'+hash,runScripts:'outside-only'});
 t.after(()=>dom.window.close());const w=dom.window,d=w.document;w.scrollTo=()=>{};
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 w.eval(d.querySelector('script').textContent);
 const key=(k,node=d.body,extra={})=>node.dispatchEvent(new w.KeyboardEvent('keydown',{key:k,bubbles:true,cancelable:true,...extra}));
 return {w,d,key,current:()=>d.querySelector('.slide:not([hidden])').id};
}
test('self-contained deck has 20 unique slides, speaker notes and valid internal links',t=>{
 const b=boot(t);const slides=[...b.d.querySelectorAll('.slide')];assert.equal(slides.length,20);assert.equal(new Set(slides.map(s=>s.id)).size,20);
 assert.equal(b.d.querySelectorAll('script[src],link[rel=stylesheet],img:not(.visitor-counter)').length,0);
 slides.forEach(s=>assert(s.querySelector('.notes').textContent.trim()));
 for(const a of b.d.querySelectorAll('a[href^="#"]'))assert(b.d.getElementById(a.hash.slice(1)));
 assert(!source.includes('Only tool approved'));assert(!source.includes('10% cost'));assert.match(source,/@media print/);
 assert.equal(b.current(),'start');assert.equal(b.d.getElementById('previous').disabled,true);
});
test('keyboard navigation, endpoints and stable links work without stealing typing',t=>{
 const b=boot(t);b.key('j');assert.equal(b.current(),'tasks');b.key('G');assert.equal(b.current(),'discussion');assert.equal(b.d.getElementById('next').disabled,true);
 b.key('j');assert.equal(b.current(),'discussion');b.key('g');b.key('g');assert.equal(b.current(),'start');
 b.key('k');assert.equal(b.current(),'start');b.key('j',b.d.body,{isComposing:true});assert.equal(b.current(),'start');
 b.key('/');assert.equal(b.d.getElementById('contents').open,true);const input=b.d.getElementById('toc-filter');b.key('j',input);assert.equal(b.current(),'start');
 const named=boot(t,'#validation');assert.equal(named.current(),'validation');const legacy=boot(t,'#/17');assert.equal(legacy.current(),'mcp');const invalid=boot(t,'#%broken');assert.equal(invalid.current(),'start');
});
test('contents search opens selected slide, notes toggle, and print invokes browser print',t=>{
 const b=boot(t);b.d.getElementById('toc-open').click();const input=b.d.getElementById('toc-filter');input.value='worktrees';input.dispatchEvent(new b.w.Event('input'));
 assert.equal(b.d.querySelectorAll('#toc-list li:not([hidden])').length,1);b.key('Enter',input);assert.equal(b.current(),'worktrees');assert.equal(b.d.getElementById('contents').open,false);
 b.key('n');assert(b.d.body.classList.contains('show-notes'));assert.equal(b.d.getElementById('notes-toggle').getAttribute('aria-pressed'),'true');b.key('n');assert(!b.d.body.classList.contains('show-notes'));
 let printed=false;b.w.print=()=>{printed=true;};b.d.getElementById('print').click();assert(printed);
});
