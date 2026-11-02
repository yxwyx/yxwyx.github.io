const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {JSDOM}=require('jsdom');
const root=path.resolve(__dirname,'..');
const build=process.env.SITE_BUILD_DIR||path.join(root,'_site');
function htmlFiles(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(entry=>{
  const file=path.join(dir,entry.name);
  return entry.isDirectory()?htmlFiles(file):file.endsWith('.html')?[file]:[];
});}
function policy(doc){
  const meta=doc.querySelector('meta[http-equiv="Content-Security-Policy"]');
  assert(meta,'missing CSP');
  return Object.fromEntries(meta.content.split(';').filter(s=>s.trim()).map(s=>{
    const [name,...values]=s.trim().split(/\s+/);return [name,values];
  }));
}
function hash(text){return "'sha256-"+crypto.createHash('sha256').update(text).digest('base64')+"'";}
test('every generated HTML page applies CSP before resources and allows its own executable scripts',()=>{
  const files=htmlFiles(build);assert(files.length>1);
  for(const file of files){
    const dom=new JSDOM(fs.readFileSync(file,'utf8'),{url:'https://www.yuxuanwang.org/'+path.relative(build,file)});
    try{
      const d=dom.window.document,p=policy(d),scripts=p['script-src']||p['default-src'];
      assert.deepEqual(p['default-src'],["'none'"],file);
      for(const directive of ['base-uri','object-src','form-action','script-src-attr'])assert.deepEqual(p[directive],["'none'"],file);
      assert(!scripts.includes("'unsafe-inline'")&&!scripts.includes("'unsafe-eval'")&&!scripts.includes('*'),file);
      const meta=d.querySelector('meta[http-equiv="Content-Security-Policy"]');
      for(const resource of d.querySelectorAll('script,style,link[rel=stylesheet]'))assert(meta.compareDocumentPosition(resource)&4,file+' policy must precede resources');
      for(const link of d.querySelectorAll('link[rel=stylesheet],link[rel=icon]')){
        const url=new URL(link.href);
        assert.equal(url.origin,'https://www.yuxuanwang.org');
        assert(fs.existsSync(path.join(build,decodeURIComponent(url.pathname))),link.href);
      }
      for(const script of d.querySelectorAll('script')){
        if(script.type==='application/json')continue;
        if(script.src){
          const url=new URL(script.src);
          assert.equal(url.origin,'https://www.yuxuanwang.org');assert(scripts.includes("'self'"));
          assert(fs.existsSync(path.join(build,decodeURIComponent(url.pathname))),script.src);
        }else assert(scripts.includes(hash(script.textContent)),file+' inline script needs a matching hash');
      }
      for(const element of d.querySelectorAll('*'))for(const attr of element.attributes)assert(!/^on/i.test(attr.name),file+' inline handler');
      for(const style of d.querySelectorAll('style'))assert(p['style-src'].includes("'unsafe-inline'")||p['style-src'].includes(hash(style.textContent)),file+' stylesheet hash mismatch');
    }finally{dom.window.close();}
  }
});
test('terminal limits third-party scripts, connections and frames to the guestbook provider',()=>{
  const dom=new JSDOM(fs.readFileSync(path.join(build,'guestbook.html'),'utf8'));
  try{
    const p=policy(dom.window.document);
    assert.deepEqual(p['script-src'],["'self'",'https://giscus.app/client.js']);
    assert.deepEqual(p['frame-src'],['https://giscus.app']);
    assert.deepEqual(p['connect-src'],["'none'"]);
    assert(!('frame-ancestors' in p),'frame-ancestors cannot be enforced by a meta tag');
  }finally{dom.window.close();}
});
test('published giscus config matches the canonical origin and rejects lookalikes and local previews',()=>{
  const config=JSON.parse(fs.readFileSync(path.join(root,'giscus.json'),'utf8'));
  assert.deepEqual(JSON.parse(fs.readFileSync(path.join(build,'giscus.json'),'utf8')),config);
  const dom=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'));
  try{
    const origin=new URL(dom.window.document.querySelector('link[rel=canonical]').href).origin;
    assert.deepEqual(config.origins,[origin]);assert(!config.originsRegex?.length);
    for(const denied of ['http://www.yuxuanwang.org','https://www.yuxuanwang.org.example.com','https://example.com','http://127.0.0.1:8765','http://localhost:4000'])assert(!config.origins.includes(denied));
  }finally{dom.window.close();}
});
test('each generated page eagerly loads exactly one image counter without enabling third-party analytics scripts',()=>{
  const home=new JSDOM(fs.readFileSync(path.join(build,'index.html'),'utf8'));
  const config=JSON.parse(home.window.document.getElementById('portfolio-data').textContent).visitors;
  home.window.close();
  assert.equal(config.url,'https://mapmyvisitors.com/web/1c4b3');
  for(const file of htmlFiles(build)){
    const dom=new JSDOM(fs.readFileSync(file,'utf8'));
    try{
      const d=dom.window.document,p=policy(d),counters=d.querySelectorAll('img.visitor-counter');
      assert.equal(counters.length,1,file);
      const counter=counters[0],url=new URL(counter.src);
      assert.equal(url.origin+url.pathname,'https://mapmyvisitors.com/map.png');
      assert.equal(url.searchParams.get('d'),config.id);
      assert.equal(counter.getAttribute('loading'),'eager');
      assert.equal(counter.getAttribute('referrerpolicy'),'origin');
      assert.equal(counter.getAttribute('alt'),'');
      assert(!counter.closest('template,noscript,dialog'),file+' must count before interaction and without JavaScript');
      assert(p['img-src'].includes(url.origin+url.pathname));
      assert(!(p['script-src']||[]).some(source=>source.includes('mapmyvisitors')||source==="'unsafe-eval'"));
      assert(![...d.scripts].some(script=>script.src.includes('mapmyvisitors')));
    }finally{dom.window.close();}
  }
});
