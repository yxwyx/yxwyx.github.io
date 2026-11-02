/* Tests configuration and DOM lifecycle; does not post visitor messages. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..'),build=process.env.SITE_BUILD_DIR||path.join(root,'_site');
function boot(t,url='/'){
  const file=url.startsWith('/guestbook.html')?'guestbook.html':'index.html';
  const dom=new JSDOM(fs.readFileSync(path.join(build,file),'utf8'),{url:'https://www.yuxuanwang.org'+url,runScripts:'outside-only'});
  t.after(()=>dom.window.close());const w=dom.window,d=w.document;
  w.matchMedia=()=>({matches:false});w.HTMLElement.prototype.scrollIntoView=function(){};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  let calls=0;
  const config=JSON.parse(d.getElementById('portfolio-data').textContent).guestbook;
  w.fetch=async()=>{calls++;throw Error('The categories API does not allow cross-origin requests');};
  for(const name of ['guestbook','portfolio-catalog','terminal-fs','terminal'])w.eval(fs.readFileSync(path.join(root,'assets/js/'+name+'.js'),'utf8'));
  return {w,d,config,calls:()=>calls,wait:()=>new Promise(r=>w.setTimeout(r,15)),run(value){const input=d.getElementById('command-input');input.focus();input.value=value;d.getElementById('command-form').dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}};
}
test('homepage is quiet; guestbook offers a real public link when embedding is unavailable',async t=>{
  const b=boot(t);assert.equal(b.calls(),0);assert.equal(b.d.querySelector('.guestbook-dialog'),null);
  b.run('guestbook');await b.wait();const dialog=b.d.querySelector('.guestbook-dialog');assert(dialog.open);
  assert.equal(dialog.querySelector('.guestbook-actions a').href,b.config.discussion_url);assert.match(dialog.textContent,/Messages are public/);
  dialog.querySelector('.giscus script').dispatchEvent(new b.w.Event('error'));assert.equal(dialog.querySelector('.giscus script'),null);assert.match(dialog.querySelector('[role=status]').textContent,/Read and leave a message on GitHub/);
  dialog.dispatchEvent(new b.w.Event('cancel',{cancelable:true}));assert.equal(dialog.open,false);assert.equal(b.d.activeElement,b.d.getElementById('command-input'));
  b.run('help');assert(b.d.querySelector('[data-command="guestbook"]'));
});
test('widget loads without a cross-origin API precheck; retry uses one fixed discussion and validates messages',async t=>{
  const b=boot(t);b.run('guestbook');await b.wait();const dialog=b.d.querySelector('.guestbook-dialog');dialog.querySelector('.giscus script').dispatchEvent(new b.w.Event('error'));dialog.querySelector('.guestbook-actions button').click();await b.wait();
  const script=dialog.querySelector('.giscus script');assert(script);assert.equal(script.src,'https://giscus.app/client.js');assert.equal(script.getAttribute('data-mapping'),'number');assert.equal(script.getAttribute('data-term'),String(b.config.discussion_number));assert.equal(script.getAttribute('data-repo-id'),b.config.repo_id);
  script.dispatchEvent(new b.w.Event('load'));dialog.close();b.run('guestbook');await b.wait();assert.equal(b.d.querySelectorAll('.guestbook-dialog').length,1);assert.equal(b.d.querySelectorAll('.giscus script').length,1);assert.equal(b.calls(),0);
  const frame=b.d.createElement('iframe');frame.className='giscus-frame';dialog.querySelector('.giscus').append(frame);
  b.w.dispatchEvent(new b.w.MessageEvent('message',{origin:'https://untrusted.example',source:frame.contentWindow,data:{giscus:{error:'fake'}}}));assert(dialog.querySelector('.giscus script'));
  b.w.dispatchEvent(new b.w.MessageEvent('message',{origin:'https://giscus.app',source:frame.contentWindow,data:{giscus:{error:'unavailable'}}}));assert.equal(dialog.querySelector('.giscus script'),null);assert.equal(dialog.querySelector('.guestbook-actions button').hidden,false);
});
test('guestbook page and hash route open the same public discussion',async t=>{
  for(const route of ['/guestbook.html','/#guestbook']){const b=boot(t,route);await b.wait();assert(b.d.querySelector('.guestbook-dialog').open);assert.equal(b.d.querySelector('.guestbook-actions a').href,'https://github.com/yxwyx/yxwyx.github.io/discussions/25');}
});
test('a blocked embed script preserves the GitHub link and allows retry',async t=>{
  const b=boot(t);b.run('guestbook');await b.wait();const dialog=b.d.querySelector('.guestbook-dialog');dialog.querySelector('.giscus script').dispatchEvent(new b.w.Event('error'));
  assert.equal(dialog.querySelector('.guestbook-actions button').hidden,false);assert.equal(dialog.querySelector('.guestbook-actions a').href,b.config.discussion_url);assert.equal(dialog.querySelector('.giscus script'),null);
});
