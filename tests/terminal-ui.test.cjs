/* DOM behavior checks; requires jsdom and a built Jekyll site. Not visual QA. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const build=process.env.SITE_BUILD_DIR||path.join(root,'_site');
function boot(t,query='') {
  const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'),{url:'http://localhost/'+query,runScripts:'outside-only'});
  t.after(()=>dom.window.close());
  const w=dom.window,d=w.document;
  w.matchMedia=()=>({matches:false});
  w.HTMLElement.prototype.scrollIntoView=function(){};
  w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};
  w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
  for(const name of ['vim-reader','portfolio-catalog','terminal-fs','terminal'])w.eval(fs.readFileSync(path.join(root,'assets/js/'+name+'.js'),'utf8'));
  const input=d.getElementById('command-input'),form=d.getElementById('command-form'),log=d.getElementById('transcript');
  function type(value,node=input){node.focus();node.value=value;node.dispatchEvent(new w.Event('input',{bubbles:true}));}
  function submit(node=form){node.dispatchEvent(new w.Event('submit',{bubbles:true,cancelable:true}));}
  function run(value){type(value);submit();}
  function key(value,node=input,extra={}){const e=new w.KeyboardEvent('keydown',{key:value,bubbles:true,cancelable:true,...extra});node.dispatchEvent(e);return e;}
  return {w,d,input,log,type,run,key,submit,tick:()=>new Promise(resolve=>w.setTimeout(resolve,5))};
}
test('visitors exposes the existing map without reloading or duplicating the page counter',t=>{
  const b=boot(t),counter=b.d.querySelector('img.visitor-counter');
  assert(counter);assert.equal(b.log.children.length,0);
  b.run('visitors');b.run('visitors');
  const link=b.log.lastElementChild.querySelector('a[href="https://mapmyvisitors.com/web/1c4b3"]');
  assert(link);assert.equal(link.rel,'noopener noreferrer');
  assert.equal(b.d.querySelectorAll('img.visitor-counter').length,1);
  assert.equal(b.d.querySelector('img.visitor-counter'),counter);
  b.run('clear');assert.equal(b.log.children.length,0);
  assert.equal(b.d.querySelector('img.visitor-counter'),counter);
});
test('terminal keeps the initial screen empty; completion inserts without execution',t=>{
  const b=boot(t);assert.equal(b.log.children.length,0);
  b.type('vim rese');b.key('Tab');assert.equal(b.input.value,'vim research');
  assert.equal(b.input.getAttribute('aria-expanded'),'true');assert.equal(b.log.children.length,0);
  b.key('ArrowDown');assert(b.input.hasAttribute('aria-activedescendant'));
  b.key('Enter');assert.equal(b.input.value,'vim research/');assert.equal(b.log.children.length,0);
  assert.equal(b.input.getAttribute('aria-expanded'),'false');
  b.type('vim rese');b.key('Tab');b.key('Escape');assert.equal(b.input.value,'vim research');
  b.type('vim rese');b.key('Tab');b.d.querySelectorAll('[role=option]')[1].click();assert.equal(b.input.value,'vim research.md');assert.equal(b.log.children.length,0);
  b.type('whoa');b.key('Tab');assert.equal(b.input.value,'whoami');assert.equal(b.key('Tab').defaultPrevented,false);
});
test('history suggestions, draft restoration, editing, and composition do not execute accidentally',t=>{
  const b=boot(t);b.run('papers | grep -i lipid');b.type('pap');
  assert.match(b.d.getElementById('command-ghost').textContent,/papers \| grep/);b.key('ArrowRight');assert.equal(b.input.value,'papers | grep -i lipid');
  b.type('unfinished');b.key('ArrowUp');assert.equal(b.input.value,'papers | grep -i lipid');b.key('ArrowDown');assert.equal(b.input.value,'unfinished');
  b.type('cat about.txt');b.key('w',b.input,{ctrlKey:true});assert.equal(b.input.value,'cat ');
  b.key('a',b.input,{ctrlKey:true});assert.equal(b.input.selectionStart,0);b.key('k',b.input,{ctrlKey:true});assert.equal(b.input.value,'');
  b.type('retained');b.input.setSelectionRange(0,3);assert.equal(b.key('c',b.input,{ctrlKey:true}).defaultPrevented,false);assert.equal(b.input.value,'retained');
  b.input.setSelectionRange(8,8);b.key('c',b.input,{ctrlKey:true});assert.equal(b.input.value,'');
  const count=b.log.children.length;b.type('研究');b.input.dispatchEvent(new b.w.CompositionEvent('compositionstart'));
  assert.equal(b.key('Enter').defaultPrevented,true);b.submit();assert.equal(b.log.children.length,count);
  b.input.dispatchEvent(new b.w.CompositionEvent('compositionend'));b.run('help');assert.equal(b.log.children.length,count+1);
  b.type('x'.repeat(513));b.submit();assert.equal(b.log.children.length,count+1);assert.match(b.d.getElementById('input-notice').textContent,/Nothing was run/);
});
test('reader opens relative and absolute portfolio paths, rejects directories, and restores terminal focus',async t=>{
  const b=boot(t);b.run('vim research');await b.tick();assert.equal(b.d.querySelector('.vim-dialog'),null);assert.match(b.log.lastElementChild.textContent,/Is a directory/);
  b.run('vim absent.txt');assert.match(b.log.lastElementChild.textContent,/No such portfolio path/);
  b.run('cd research');b.run('vim gwas.md');await b.tick();assert.equal(b.d.querySelector('.vim-dialog').open,true);assert.equal(b.d.getElementById('vim-title').textContent,'~/research/gwas.md');
  const buffer=b.d.querySelector('.vim-buffer');b.key(':',buffer);b.type('q',b.d.getElementById('vim-command-input'));b.submit(b.d.querySelector('.vim-command'));
  assert.equal(b.d.querySelector('.vim-dialog').open,false);assert.equal(b.d.activeElement,b.input);assert.match(b.d.querySelector('.prompt-path').textContent,/research/);
  b.run('view /home/yuxuan/papers.bib');await b.tick();assert.match(b.d.querySelector('.vim-buffer').textContent,/@article/);assert.equal(b.d.querySelectorAll('.vim-dialog').length,1);
});
test('Vim navigation, literal search, read-only commands, IME, and safe text rendering',t=>{
  const b=boot(t);b.input.focus();b.w.openVimReader({path:'~/fixture.txt',text:'signal signal\nsecond line\nSIGNAL\n<img src=x onerror=alert(1)>\n[a.b]\nfinal'});
  const buffer=b.d.querySelector('.vim-buffer'),cmd=b.d.getElementById('vim-command-input'),form=b.d.querySelector('.vim-command');
  const position=()=>b.d.getElementById('vim-position').textContent;
  const ex=value=>{b.key(':',buffer);b.type(value,cmd);b.submit(form);};
  assert.equal(buffer.querySelector('img'),null);b.key('j',buffer);assert.match(position(),/^2 \/ 6/);b.key('G',buffer);assert.match(position(),/^6 \/ 6/);
  b.key('g',buffer);b.key('g',buffer);assert.match(position(),/^1 \/ 6/);
  b.key('/',buffer);b.type('signal',cmd);b.submit(form);assert.equal(buffer.querySelectorAll('mark').length,3);assert.match(b.d.getElementById('vim-match-count').textContent,/1 \/ 3/);
  b.key('n',buffer);assert.match(b.d.getElementById('vim-match-count').textContent,/2 \/ 3/);b.key('N',buffer);assert.match(b.d.getElementById('vim-match-count').textContent,/1 \/ 3/);
  b.key('N',buffer);assert.match(position(),/^3 \/ 6/);b.key('n',buffer);assert.match(position(),/^1 \/ 6/);
  b.key('/',buffer);b.type('[a.b]',cmd);b.submit(form);assert.equal(buffer.querySelectorAll('mark').length,1);assert.match(position(),/^5 \/ 6/);
  ex('2');assert.match(position(),/^2 \/ 6/);ex('set nonumber');assert(buffer.classList.contains('vim-no-numbers'));ex('set number');assert(!buffer.classList.contains('vim-no-numbers'));
  ex('noh');assert.equal(buffer.querySelectorAll('mark').length,0);ex('w');assert.match(b.d.querySelector('.vim-notice').textContent,/Read-only/);assert.equal(b.d.querySelector('.vim-dialog').open,true);
  b.key('/',buffer);b.type('not present',cmd);b.submit(form);assert.match(b.d.querySelector('.vim-notice').textContent,/Pattern not found/);
  b.key(':',buffer);b.type('q',cmd);cmd.dispatchEvent(new b.w.CompositionEvent('compositionstart'));b.submit(form);assert.equal(b.d.querySelector('.vim-dialog').open,true);
  cmd.dispatchEvent(new b.w.CompositionEvent('compositionend'));b.key('Escape',cmd);assert.equal(form.hidden,true);assert.equal(b.d.querySelector('.vim-dialog').open,true);
  b.d.querySelector('.vim-dialog').dispatchEvent(new b.w.Event('cancel',{cancelable:true}));assert.equal(b.d.querySelector('.vim-dialog').open,false);assert.equal(b.d.activeElement,b.input);
});
test('direct reader demo resolves to a portfolio file',async t=>{
  const b=boot(t,'?read=papers.bib');await b.tick();assert.equal(b.d.querySelector('.vim-dialog').open,true);assert.equal(b.d.getElementById('vim-title').textContent,'~/papers.bib');
});

test('search preserves Unicode offsets and page movement follows the viewport',t=>{
  const b=boot(t);b.w.openVimReader({path:'~/unicode.txt',text:'İsignal\nnext\nlast'});
  const buffer=b.d.querySelector('.vim-buffer'),cmd=b.d.getElementById('vim-command-input');
  b.key('/',buffer);b.type('signal',cmd);b.submit(b.d.querySelector('.vim-command'));
  assert.equal(buffer.querySelector('mark').textContent,'signal');
  Object.defineProperty(buffer,'clientHeight',{value:240});
  buffer.getBoundingClientRect=()=>({top:0});
  [...buffer.children].forEach((row,i)=>{row.getBoundingClientRect=()=>({bottom:(i+1)*100-buffer.scrollTop});});
  buffer.scrollTop=0;b.key('d',buffer,{ctrlKey:true});assert.equal(buffer.scrollTop,120);assert.match(b.d.getElementById('vim-position').textContent,/^2 \/ 3/);
  b.key('u',buffer,{ctrlKey:true});assert.equal(buffer.scrollTop,0);
});

test('paper groups, chronological filters, and pipelines preserve all records and stable file names',t=>{
  const b=boot(t);const ids=()=>[...b.log.lastElementChild.querySelectorAll('[data-paper]')].map(n=>n.dataset.paper);
  b.run('papers');assert.equal(ids().length,6);assert.equal(new Set(ids()).size,6);
  assert.equal(b.log.lastElementChild.querySelectorAll('.paper-group-title').length,2);
  assert.deepEqual(ids().slice(0,3),['10.1016/j.ajhg.2023.09.003','10.1186/s13059-022-02837-1','10.1016/j.ajhg.2022.06.012']);
  assert.equal(ids()[3],'10.1186/s13059-025-03698-0');
  b.run('papers --all');assert.equal(ids()[0],'10.1186/s13059-025-03698-0');assert.equal(ids()[1],'10.1016/j.ajhg.2023.09.003');
  b.run('papers --featured');assert.equal(ids().length,3);
  b.run('papers --year 2025');assert.deepEqual(ids(),['10.1186/s13059-025-03698-0']);
  b.run('papers --featured | wc -l');assert.equal(b.log.lastElementChild.querySelector('pre').textContent,'3');
  b.run('papers | wc -l');assert.equal(b.log.lastElementChild.querySelector('pre').textContent,'6');
  b.run('papers --bad');assert.match(b.log.lastElementChild.textContent,/Usage: papers/);
  b.run('cat papers/01-2023.txt');assert.deepEqual(ids(),['10.1016/j.ajhg.2023.09.003']);
});
test('site search indexes metadata and full essays once, accepts all words, and treats input as text',t=>{
  const b=boot(t);b.run('search LiPiD');
  let results=b.log.lastElementChild.querySelectorAll('.search-result');assert(results.length>3);
  const keys=[...results].map(r=>r.querySelector('[data-route]').dataset.route);assert.equal(new Set(keys).size,keys.length);
  for(const type of ['paper/','research/','talk/'])assert(keys.some(k=>k.startsWith(type)),type);
  b.run('search ENSG');assert(b.log.lastElementChild.querySelector('[data-route^="writing/"]'));
  b.run('search rare variants');assert(b.log.lastElementChild.querySelector('[data-route^="paper/"]'));
  b.run('search "<img src=x onerror=alert(1)>"');assert.equal(b.log.lastElementChild.querySelector('img'),null);assert.match(b.log.lastElementChild.textContent,/No matches/);
  b.run('search [');assert(b.log.lastElementChild.querySelector('[data-route^="writing/"]'));assert.equal(b.log.lastElementChild.querySelector('mark').textContent,'[');
  b.run('search');assert.match(b.log.lastElementChild.textContent,/Usage: search/);
  b.type('open research/g');b.key('Tab');assert.equal(b.input.value,'open research/gwas');
});
test('stable routes open papers, research, essays and talks; unknown items report an error',t=>{
  for(const [route,expected] of [
    ['paper/10.1016/j.ajhg.2023.09.003','Rare variants in long non-coding RNAs'],
    ['research/gwas','A wider view of lipid genetics'],
    ['writing/ai-assisted-statistical-genetics-coding','Institutional compliance'],
    ['talk/replei-ness-2025','NESS 2025'],
    ['paper/absent','No portfolio item: paper/absent']
  ]){const b=boot(t,'#'+route);assert(b.log.textContent.includes(expected),route);if(route.startsWith('paper/10.'))assert.equal(b.log.querySelectorAll('[data-paper]').length,1);}
  const b=boot(t,'#search/'+encodeURIComponent('clear | tank'));assert.match(b.log.textContent,/No matches/);assert.equal(b.d.querySelector('.tank-dialog'),null);
});
test('permalinks open in the current session and browser history restores the chosen item',async t=>{
  const b=boot(t);b.run('search lipid');
  const a=b.log.querySelector('.search-result [data-route^="paper/"]');const key=a.dataset.route;
  a.click();assert.equal(decodeURIComponent(b.w.location.hash.slice(1)),key);assert.equal(b.log.lastElementChild.querySelectorAll('[data-paper]').length,1);
  const entries=b.log.children.length;
  b.w.history.back();await new Promise(resolve=>setTimeout(resolve,30));assert.equal(b.w.location.hash,'');assert.equal(b.log.children.length,0);
  b.w.history.forward();await new Promise(resolve=>setTimeout(resolve,30));assert.equal(decodeURIComponent(b.w.location.hash.slice(1)),key);assert.equal(b.log.children.length,1);assert(entries>0);
});
test('share copies a local deep link, citation copy keeps the source DOI after sorting, and denied clipboard falls back',async t=>{
  const b=boot(t);let copied='';
  Object.defineProperty(b.w.navigator,'clipboard',{configurable:true,value:{writeText:async text=>{copied=text;}}});
  b.run('papers --all');
  const paper=b.log.lastElementChild.querySelector('[data-paper="10.1016/j.ajhg.2022.06.012"]');
  paper.querySelector('[data-cite]').click();await b.tick();assert.match(copied,/10\.1016\/j\.ajhg\.2022\.06\.012/);
  paper.querySelector('[data-share]').click();await b.tick();const url=new URL(copied);assert.equal(url.origin,'http://localhost');assert.equal(decodeURIComponent(url.hash.slice(1)),'paper/10.1016/j.ajhg.2022.06.012');
  b.w.navigator.clipboard.writeText=async()=>{throw Error('Clipboard denied');};
  paper.querySelector('[data-share]').click();await b.tick();const field=paper.querySelector('.share-url');assert.equal(field.value,copied);assert.equal(field.selectionEnd,field.value.length);assert.equal(field.readOnly,true);
});

test('merged talks keep both event links and appear once in search and the reader',t=>{
  const b=boot(t),title='Rare Variants in Long Non-coding RNAs are Associated with Blood Lipid Levels in the TOPMed Whole Genome Sequencing Study';
  b.run('talks');const items=[...b.log.lastElementChild.querySelectorAll('.talk-item')];
  assert.equal(items.length,6);const grouped=items.filter(n=>n.querySelector('h3').textContent===title);assert.equal(grouped.length,1);
  assert.match(grouped[0].textContent,/2023 \/ BU-FHS/);assert.match(grouped[0].textContent,/2022 \/ ASHG/);
  for(const id of ['lncrna-ashg-2022','lncrna-bu-2023']){
    b.run('open talk/'+id);assert.equal(b.log.lastElementChild.querySelector('h2').textContent,title);
    assert.match(b.log.lastElementChild.textContent,/BU-FHS/);assert.match(b.log.lastElementChild.textContent,/ASHG/);
    const deep=boot(t,'#talk/'+id);assert.match(deep.log.textContent,/BU-FHS/);assert.match(deep.log.textContent,/ASHG/);
  }
  b.run('search long non-coding RNAs');const talks=[...b.log.lastElementChild.querySelectorAll('.search-result')].filter(n=>n.querySelector('[data-route]').dataset.route.startsWith('talk/'));assert.equal(talks.length,1);
  b.run('cat talks.txt');const text=b.log.lastElementChild.querySelector('pre').textContent;assert.equal(text.split(title).length-1,1);assert.match(text,/2023 \| BU-FHS/);assert.match(text,/2022 \| ASHG/);
});
