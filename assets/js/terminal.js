(function () {
  'use strict';
  var data = JSON.parse(document.getElementById('portfolio-data').textContent);
  var form = document.getElementById('command-form');
  var input = document.getElementById('command-input');
  var transcript = document.getElementById('transcript');
  var history = [], historyIndex = 0, draft = '';
  var composing=false, pendingLaunch=null, candidates=[], candidateIndex=-1, ghostValue='';
  var ghost=document.getElementById('command-ghost'), completionPanel=document.getElementById('completion-panel'), completionOptions=document.getElementById('completion-options'), inputNotice=document.getElementById('input-notice');
  var commands = ['help', 'search', 'open', 'whoami', 'about', 'research', 'papers', 'musings', 'talks', 'teaching', 'news', 'contact', 'ls', 'clear', 'history', 'theme amber', 'theme green', 'theme white'];
  var themes = ['amber', 'green', 'white'];
  var themesInfo = [
    {title:'A wider view of lipid genetics', key:'gwas', description:'Multi-ancestry GWAS meta-analysis, gene prioritization, pleiotropy, and sex differences in blood lipid traits. In GLGC, I work on connecting association signals with biological interpretation.'},
    {title:'Looking beyond the common', key:'wgs', description:'Rare coding and noncoding variation in whole-genome sequencing. My work in TOPMed includes rare-variant association analyses of long noncoding RNAs and collaborative studies of blood lipid levels.'},
    {title:'How robust is the signal?', key:'methods', description:'Bayesian frameworks for quantifying the replicability of pleiotropic loci across studies and populations. A methodological interest in assessing how well genetic associations stand up to scrutiny.'}
  ];
  var help = [
    ['whoami', 'The person behind the prompt'], ['about', 'Background, training, collaborators'],
    ['search lipid', 'Search papers, talks, essays & research'],
    ['research', 'Three questions I work on'], ['papers', 'Publications & citation exports'],
    ['musings', 'Notes on research and AI'], ['talks', 'Presentations, places, ideas'],
    ['teaching', 'Teaching & statistical computing'], ['news', 'A few recent milestones'],
    ['contact', 'Find me elsewhere'], ['vim papers.bib', 'Read portfolio files with Vim navigation'], ['tank', 'A pixel tank game hidden in the terminal'], ['clear', 'A clean screen']
  ];
  var catalog=window.createPortfolioCatalog(data,themesInfo,templateText);
  var shell = window.createPortfolioShell({data:data, themes:themesInfo, commands:commands,
    el:el, line:line, heading:heading, link:link, commandButton:commandButton,
    suggest:suggest, template:template, research:research, listPapers:listPapers, selectPapers:catalog.selectPapers, paperView:paperView, search:searchContent, open:openContent, contentKeys:catalog.keys,
    history:function(){return history;}, launch:function(fn){if(pendingLaunch!==null)clearTimeout(pendingLaunch);pendingLaunch=setTimeout(function(){pendingLaunch=null;fn();},0);}});
  function el(tag, text, cls) {
    var node = document.createElement(tag);
    if (text !== undefined && text !== null) node.textContent = text;
    if (cls) node.className = cls;
    return node;
  }
  function line(parent, text, cls) { parent.appendChild(el('p', text, cls)); }
  function heading(parent, title, subtitle) {
    if (subtitle) line(parent, subtitle, 'section-tag');
    parent.appendChild(el('h2', title));
  }
  function link(parent, text, href) {
    var a = el('a', text); a.href = href;
    if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    parent.appendChild(a); return a;
  }
  function commandButton(parent, label, command) {
    var b = el('button', label, 'command-button'); b.type = 'button'; b.dataset.command = command || label;
    parent.appendChild(b); return b;
  }
  function suggest(parent, suggestions) {
    var row = el('div', null, 'suggestions');
    suggestions.forEach(function (s) { commandButton(row, s, s); }); parent.appendChild(row);
  }
  function template(parent, id) { parent.appendChild(document.getElementById(id).content.cloneNode(true)); }
  function setTheme(theme) {
    document.documentElement.dataset.phosphor = theme;
    try { localStorage.setItem('phosphor', theme); } catch (e) {}
  }
  function clearScreen() { transcript.replaceChildren(); }
  function feedback(message) { inputNotice.textContent=message||'';inputNotice.hidden=!message; }
  function syncInput() {
    input.parentElement.classList.toggle('has-value', input.value.length > 0);
    ghost.replaceChildren();ghostValue='';
    if(!composing&&completionPanel.hidden&&input.value&&document.activeElement===input&&input.selectionStart===input.value.length&&input.selectionEnd===input.value.length){
      ghostValue=history.slice().reverse().find(function(h){return h.startsWith(input.value)&&h!==input.value;})||'';
      if(ghostValue){var prefix=el('span',input.value,'ghost-prefix');ghost.append(prefix,document.createTextNode(ghostValue.slice(input.value.length)));}
    }
    ghost.style.transform='translateX(-'+input.scrollLeft+'px)';
  }
  function closeCompletions() {
    candidates=[];candidateIndex=-1;completionPanel.hidden=true;completionOptions.replaceChildren();
    input.setAttribute('aria-expanded','false');input.removeAttribute('aria-activedescendant');syncInput();
  }
  function selectCandidate(index) {
    candidateIndex=(index+candidates.length)%candidates.length;
    Array.from(completionOptions.children).forEach(function(n,i){n.setAttribute('aria-selected',String(i===candidateIndex));});
    var selected=completionOptions.children[candidateIndex];input.setAttribute('aria-activedescendant',selected.id);selected.scrollIntoView({block:'nearest',behavior:'instant'});
  }
  function showCompletions(values) {
    candidates=values;candidateIndex=-1;completionOptions.replaceChildren();
    values.forEach(function(value,i){var option=el('div',value,'completion-option');option.id='completion-'+i;option.setAttribute('role','option');option.setAttribute('aria-selected','false');option.addEventListener('mousedown',function(e){e.preventDefault();});option.addEventListener('click',function(){acceptCandidate(i);});completionOptions.appendChild(option);});
    completionPanel.hidden=false;input.setAttribute('aria-expanded','true');syncInput();
  }
  function setInput(value) { input.value=value;input.setSelectionRange(value.length,value.length);syncInput(); }
  function acceptCandidate(index) { var value=candidates[Math.max(0,index)];closeCompletions();setInput(value);input.focus({preventScroll:true});syncInput();feedback('Completion inserted. Enter runs it.'); }
  function cancelInput() {
    if(pendingLaunch!==null){clearTimeout(pendingLaunch);pendingLaunch=null;}
    closeCompletions();input.value='';draft='';historyIndex=history.length;syncInput();feedback('^C · input cancelled');
  }

  function entry(raw) {
    var block = el('section', null, 'entry');
    var echo = el('div', null, 'echo');
    var prompt = el('span', 'guest@yxw:'+shell.path()+' $', 'prompt'); prompt.setAttribute('aria-hidden', 'true');
    echo.appendChild(prompt); echo.appendChild(document.createTextNode(raw));
    var output = el('div', null, 'output'); block.append(echo, output); transcript.appendChild(block);
    return {block:block, output:output};
  }
  function templateText(id) {
    var source=document.getElementById(id);if(!source)return '';
    var copy=source.content.cloneNode(true);
    copy.querySelectorAll('script,style').forEach(function(n){n.remove();});
    copy.querySelectorAll('h1,h2,h3,h4,p,li,pre,br').forEach(function(n){n.appendChild(document.createTextNode(' '));});
    return copy.textContent.replace(/\s+/g,' ').trim();
  }
  function routeURL(key) {
    var url=new URL(data.home||'/',location.origin);
    url.hash=key.split('/').map(encodeURIComponent).join('/');return url.href;
  }
  function routeLink(parent,label,key) {
    var a=el('a',label);a.href=routeURL(key);a.dataset.route=key;parent.appendChild(a);return a;
  }
  function share(parent,key) {
    var row=el('span',null,'share-actions');
    routeLink(row,'[ permalink ]',key);
    var b=el('button','[ copy link ]','terminal-copy');b.type='button';b.dataset.share=key;row.appendChild(b);parent.appendChild(row);
  }
  function paperView(out,args) {
    var records=catalog.selectPapers(args);
    heading(out,args.length?'Publications / '+(args[0]==='--year'?args[1]:args[0].slice(2)):'Selected publications','~/papers/');
    if(!args.length){
      var lead=records.filter(catalog.featured),other=records.filter(function(p){return !catalog.featured(p);});
      if(lead.length){out.appendChild(el('h3','First & co-first author','paper-group-title'));listPapers(out,lead);}
      if(other.length){out.appendChild(el('h3','Other publications · newest first','paper-group-title'));listPapers(out,other);}
    }else {line(out,records.length+' listed publications · newest first','muted small');listPapers(out,records);}
    if(!records.length)line(out,'No listed publications for this selection.','muted');
    suggest(out,['papers --all','papers --featured','papers --year 2025']);
    var more=el('p',null,'small');link(more,'Full publication record on Google Scholar ↗',data.scholar);out.appendChild(more);
  }
  function openContent(out,key) {
    var record=catalog.get(key);
    if(!record){line(out,'No portfolio item: '+key,'error');suggest(out,['search lipid','papers','musings']);return;}
    if(record.type==='paper'){heading(out,'Publication','~/papers/');listPapers(out,[data.papers[record.index]]);}
    else if(record.type==='research')research(out,themesInfo[record.index].key);
    else if(record.type==='writing'){template(out,'writing-'+record.index);share(out,key);}
    else if(record.type==='talk'){
      var talk=data.talks[record.index];heading(out,talk.title,talk.year+' / '+talk.venue+' / '+talk.location);share(out,key);
    }else if(key==='contact'){
      heading(out,'Continue the conversation.');[['Google Scholar',data.scholar],['GitHub',data.github],['LinkedIn',data.linkedin]].forEach(function(pair){var p=el('p');link(p,pair[0]+' ↗',pair[1]);out.appendChild(p);});share(out,key);
    }else {template(out,key+'-source');share(out,key);}
  }
  function highlighted(parent,text,terms) {
    var escaped=terms.slice().sort(function(a,b){return b.length-a.length;}).map(function(t){return t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');});
    if(!escaped.length){parent.appendChild(document.createTextNode(text));return;}
    var pattern=new RegExp(escaped.join('|'),'giu'),match,cursor=0;
    while((match=pattern.exec(text))!==null){parent.appendChild(document.createTextNode(text.slice(cursor,match.index)));parent.appendChild(el('mark',match[0]));cursor=match.index+match[0].length;}
    parent.appendChild(document.createTextNode(text.slice(cursor)));
  }
  function searchContent(out,query) {
    query=query.replace(/\s+/g,' ').trim();
    if(!query){heading(out,'Search the portfolio');line(out,'Usage: search <words> · Matches all words, case insensitive. Searches publications, talks, essays, research, and profile pages.');suggest(out,['search lipid','search RePlei','search Bayesian']);return;}
    var results=catalog.search(query),terms=Array.from(new Set(query.toLowerCase().split(' ')));
    heading(out,'Search / '+query,results.length+' results · all words · case insensitive');
    if(!results.length){line(out,'No matches. Try fewer words, a surname, or a research topic.','muted');suggest(out,['search lipid','search rare variants','search RePlei']);return;}
    results.forEach(function(record){
      var article=el('article',null,'search-result');line(article,record.type.toUpperCase()+(record.year?' / '+record.year:''),'item-number');
      var h=el('h3'),a=routeLink(h,'',record.key);highlighted(a,record.title,terms);article.appendChild(h);
      var text=record.text,lower=text.toLowerCase(),hits=terms.map(function(t){return lower.indexOf(t);}).filter(function(n){return n>=0;}),start=hits.length?Math.max(0,Math.min.apply(null,hits)-55):0;
      var excerpt=(start?'…':'')+text.slice(start,start+230)+(text.length>start+230?'…':'');
      var p=el('p',null,'muted small');highlighted(p,excerpt,terms);article.appendChild(p);share(article,record.key);out.appendChild(article);
    });
  }
  function hashRoute() { try{return decodeURIComponent(location.hash.slice(1));}catch(e){return '';} }
  function runRoute(key,focus) {
    if(key.startsWith('search/')){
      var query=key.slice(7);if(query.length>480)return false;
      run('search '+query,focus,function(out){searchContent(out,query);});return true;
    }
    if(!catalog.get(key)&&! /^(paper|research|writing|talk)\//.test(key))return false;
    run('open '+key,focus,function(out){openContent(out,key);});return true;
  }

  function listPapers(out, records) {
    catalog.newest(records).forEach(function (paper) {
      var index = data.papers.indexOf(paper) + 1;
      var article = el('article', null, 'paper-item');article.dataset.paper=paper.doi;
      article.appendChild(el('span', '[' + String(index).padStart(2,'0') + '] ' + paper.journal + (paper.research_role ? ' / ' + paper.research_role + ' author' : ''), 'item-number'));
      var h = el('h3'); link(h, paper.title + ' ↗', paper.website); article.appendChild(h);
      line(article, paper.authors);
      if (paper.research_contribution) line(article, paper.research_contribution);
      var actions = el('div', null, 'paper-actions');
      link(actions, '[ read paper ↗ ]', paper.website);
      if (paper.code) link(actions, '[ code ↗ ]', paper.code);
      if (paper.bibtex) { var copy = el('button', '[ copy citation ]', 'terminal-copy'); copy.type='button'; copy.dataset.cite=String(index-1); actions.appendChild(copy); }
      share(actions,'paper/'+paper.doi);article.appendChild(actions); out.appendChild(article);
    });
  }
  function research(out, arg) {
    var aliases = {'1':0,'01':0,'gwas':0,'2':1,'02':1,'wgs':1,'3':2,'03':2,'methods':2};
    if (arg && !Object.prototype.hasOwnProperty.call(aliases,arg)) { line(out,'Unknown theme. Try research 1, research 2, or research 3.'); return; }
    heading(out, arg ? themesInfo[aliases[arg]].title : 'Different scales. Connected questions.', '~/research/');
    var selected = arg ? [themesInfo[aliases[arg]]] : themesInfo;
    selected.forEach(function (theme) {
      var i = themesInfo.indexOf(theme) + 1;
      var item = el('div', null, 'research-item');
      if (!arg) { var h=el('h3'); commandButton(h, '0'+i+'  '+theme.title, 'research '+i); item.appendChild(h); }
      line(item,theme.description);
      if (arg) {
        share(item,'research/'+theme.key);
        if (theme.key==='methods') {
          line(item,'Featured presentation: RePlei — Replication of pleiotropic loci with GWAS summary statistics. NESS 2025, New Haven.','muted');
          suggest(item,['talks','papers']);
        } else { listPapers(item,data.papers.filter(function(p){return p.research_theme===theme.key;})); }
      } else commandButton(item,'→ explore this thread','research '+i);
      out.appendChild(item);
    });
    if (!arg) suggest(out,['research 1','research 2','research 3']);
  }
  function run(raw, focus, render) {
    raw = raw.trim(); if (!raw) raw = 'help';
    if(raw==='!!')raw=history.length?history[history.length-1]:'help';
    if(raw.length>512){feedback('Command too long: maximum 512 characters. Nothing was run.');return;}
    closeCompletions();feedback('');
    history.push(raw); historyIndex = history.length; draft = '';
    input.value=''; syncInput();
    var parts=raw.toLowerCase().split(/\s+/), cmd=parts.shift(), arg=parts.join(' ');
    if (cmd==='clear' || cmd==='reset') { clearScreen(); if(focus)input.focus(); return; }
    var result=entry(raw), out=result.output;
    if(render)render(out);
    else if (!shell.execute(raw,out)) switch(cmd) {
      case 'help':
        heading(out,'A person, a few questions, a lot of code.','YW/OS · command reference');
        line(out,'Explore at your own pace. Type a command or select one below.','muted small');
        help.forEach(function(row){var r=el('div',null,'help-row');commandButton(r,row[0]);r.appendChild(el('span',row[1]));out.appendChild(r);});
        line(out,'Filesystem: cd · ls -a · tree · cat · vim <file> · find · grep','muted small');
        line(out,'Shell: pipes · Tab menu · → accept history suggestion · Ctrl+R history · Ctrl+C cancel · !! repeat','muted small');
        line(out,'Read a manual: man pipes / man keyboard. Change colors: theme green.','muted small');
        suggest(out,['neofetch','tree','papers | grep -i lipid | head 3','man pipes']); break;
      case 'whoami':
        out.appendChild(el('pre',[
          ' __   __ _   _ __  __ _   _   _    _   _',
          ' \\ \\ / /| | | |\\ \\/ /| | | | / \\  | \\ | |',
          '  \\ V / | | | | >  < | | | |/ _ \\ |  \\| |',
          '   | |  | |_| |/ /\\ \\| |_| / ___ \\| |\\  |',
          '   |_|   \\___//_/  \\_\\\\___/_/   \\_\\_| \\_|',
          '                         W A N G'
        ].join('\n'),'ascii-name'));
        var dl=el('dl',null,'identity');
        [['name','Yuxuan Wang'],['role','Statistical geneticist'],['currently','Postdoctoral Researcher · Broad Institute'],['focus','Human genetics & cardiometabolic traits']].forEach(function(row){dl.append(el('dt',row[0]),el('dd',row[1]));});out.appendChild(dl);
        line(out,'Finding meaning in genetic variation.','tagline');
        suggest(out,['about','research','contact']);break;
      case 'about':
        heading(out,'Yuxuan Wang','~/about.txt');template(out,'about-source');suggest(out,['research','talks','news']);break;
      case 'research':research(out,arg);break;
      case 'papers': case 'publications':
        paperView(out,[]);break;
      case 'musings': case 'writing':
        heading(out,'Notes from the research workflow.','~/musings/');
        data.posts.forEach(function(post){var a=el('article',null,'post-item');line(a,post.date,'item-number');var h=el('h3');link(h,post.title+' ↗',post.url);a.appendChild(h);line(a,post.excerpt,'muted small');share(a,'writing/'+post.url.split('/').filter(Boolean).pop());out.appendChild(a);});break;
      case 'read':
        if (data.page.indexOf('/musings/')===0) {template(out,'page-source');var post=data.posts.find(function(p){return p.url===data.page;});if(post)share(out,'writing/'+post.url.split('/').filter(Boolean).pop());}
        else {line(out,'Choose an essay from the writing directory.');suggest(out,['musings']);}break;
      case 'talks': case 'presentations':
        heading(out,'Ideas shared out loud.','~/talks.txt');
        data.talks.forEach(function(t){var a=el('article',null,'talk-item');line(a,t.year+' / '+t.venue+' / '+t.location,'item-number');a.appendChild(el('h3',t.title));out.appendChild(a);});suggest(out,['research 3','teaching']);break;
      case 'teaching':template(out,'teaching-source');suggest(out,['talks','about']);break;
      case 'news':template(out,'news-source');suggest(out,['about','research']);break;
      case 'contact':
        heading(out,'Continue the conversation.','~/contact.txt');
        line(out,'Research, code, and a place to connect.','muted small');
        [['Google Scholar',data.scholar],['GitHub',data.github],['LinkedIn',data.linkedin]].forEach(function(row){var p=el('p');link(p,row[0]+' ↗',row[1]);out.appendChild(p);});break;
      case 'history':history.forEach(function(c,i){line(out,String(i+1).padStart(3,' ')+'  '+c,'small');});break;
      case 'theme':
        var current=document.documentElement.dataset.phosphor;
        var next=arg || themes[(themes.indexOf(current)+1)%themes.length];
        if(themes.indexOf(next)===-1){line(out,'Available phosphors: amber, green, white.');suggest(out,['theme amber','theme green','theme white']);}
        else {setTheme(next);line(out,'Phosphor set to '+next+'.');}break;
      case 'sudo':line(out,'Nice try. Research privileges only.');suggest(out,['research']);break;
      case 'exit':line(out,'You can check out any time. The questions stay open.');suggest(out,['clear','contact']);break;
      default:line(out,'Command not found: '+raw,'error');line(out,'Try help to see what is here.','muted small');suggest(out,['help']);
    }
    if(focus)input.focus({preventScroll:true});
    // Keep each answer visible from its beginning, including long publication lists.
    result.block.scrollIntoView({behavior:'instant',block:'start'});
  }
  form.hidden=false;
  input.addEventListener('input',function(){closeCompletions();feedback('');historyIndex=history.length;syncInput();});
  input.addEventListener('compositionstart',function(){composing=true;closeCompletions();syncInput();});
  input.addEventListener('compositionend',function(){composing=false;syncInput();});
  ['focus','click','keyup','scroll'].forEach(function(name){input.addEventListener(name,syncInput);});
  input.addEventListener('blur',function(){ghost.replaceChildren();ghostValue='';});
  form.addEventListener('submit',function(e){e.preventDefault();if(composing)return;if(!completionPanel.hidden){acceptCandidate(candidateIndex);return;}run(input.value,true);});
  document.addEventListener('click',function(e){
    var permalink=e.target.closest('[data-route]');
    if(permalink&&!e.ctrlKey&&!e.metaKey&&!e.shiftKey&&!e.altKey&&e.button===0){e.preventDefault();if(location.href!==permalink.href)window.history.pushState(null,'',permalink.href);followedURL=location.href;runRoute(permalink.dataset.route,true);return;}
    var shareButton=e.target.closest('[data-share]');
    if(shareButton){
      var url=routeURL(shareButton.dataset.share);
      function fallback(){var existing=shareButton.parentElement.querySelector('.share-url');if(!existing){var field=el('input',null,'share-url');field.type='text';field.readOnly=true;field.value=url;field.setAttribute('aria-label','Link to copy');shareButton.parentElement.appendChild(field);existing=field;}existing.focus();existing.select();shareButton.textContent='[ select link below ]';}
      if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(url).then(function(){shareButton.textContent='[ link copied ]';setTimeout(function(){shareButton.textContent='[ copy link ]';},1800);}).catch(fallback);else fallback();
      return;
    }
    if(e.target.closest('[data-history-search]')){openHistory();return;}
    var historyChoice=e.target.closest('[data-history-select]');
    if(historyChoice){useHistory(historyChoice.dataset.historySelect);return;}
    var button=e.target.closest('[data-command]');
    if(button){run(button.dataset.command,matchMedia('(pointer:fine)').matches);return;}
    var copy=e.target.closest('[data-cite]');
    if(copy){
      var text=data.papers[Number(copy.dataset.cite)].bibtex;
      if(navigator.clipboard && navigator.clipboard.writeText){navigator.clipboard.writeText(text).then(function(){copy.textContent='[ copied ]';setTimeout(function(){copy.textContent='[ copy citation ]';},1800);}).catch(function(){showCitation(copy,text);});}
      else showCitation(copy,text);
    }
  });
  function showCitation(button,text){
    var existing=button.parentElement.parentElement.querySelector('.citation-source');
    if(!existing){var pre=el('pre',text,'citation-source');button.parentElement.after(pre);}
    button.textContent='[ select citation below ]';
  }
  input.addEventListener('keydown',function(e){
    if(composing||e.isComposing||e.keyCode===229){if(e.key==='Enter')e.preventDefault();return;}
    if(e.metaKey||e.altKey)return;
    if(e.ctrlKey){
      var key=e.key.toLowerCase();
      if(key==='c'){if(input.selectionStart!==input.selectionEnd)return;e.preventDefault();cancelInput();return;}
      if(key==='r'){e.preventDefault();openHistory();return;}
      if(key==='l'){e.preventDefault();closeCompletions();clearScreen();return;}
      var start=input.selectionStart,end=input.selectionEnd,value=input.value;
      if(key==='a'||key==='e'){e.preventDefault();var pos=key==='a'?0:value.length;input.setSelectionRange(pos,pos);syncInput();return;}
      if(['u','k','w'].includes(key)){
        e.preventDefault();closeCompletions();
        var from=key==='u'?0:key==='w'?start-value.slice(0,start).match(/\S*\s*$/)[0].length:start;
        var to=key==='k'?value.length:end;
        input.setRangeText('',from,to,'start');syncInput();return;
      }
      return;
    }
    if(!completionPanel.hidden){
      if(e.key==='ArrowDown'||e.key==='ArrowUp'||e.key==='Tab'){e.preventDefault();var backwards=e.key==='ArrowUp'||e.shiftKey;selectCandidate(candidateIndex<0?(backwards?candidates.length-1:0):candidateIndex+(backwards?-1:1));return;}
      if(e.key==='Enter'){e.preventDefault();acceptCandidate(candidateIndex);return;}
      if(e.key==='Escape'){e.preventDefault();closeCompletions();feedback('');return;}
    }
    if(e.key==='ArrowRight'&&ghostValue&&input.selectionStart===input.value.length){e.preventDefault();setInput(ghostValue);return;}
    if(e.key==='ArrowUp'){
      e.preventDefault();if(historyIndex===history.length)draft=input.value;
      if(historyIndex>0)setInput(history[--historyIndex]);
    }else if(e.key==='ArrowDown'){
      e.preventDefault();if(historyIndex<history.length)historyIndex++;
      setInput(historyIndex===history.length?draft:history[historyIndex]);
    }else if(e.key==='Tab'&&!e.shiftKey){
      var prefix=input.value,matches=shell.complete(prefix);
      if(matches.length===1&&matches[0]===prefix)return;
      if(matches.length){
        e.preventDefault();feedback('');
        if(!prefix)setInput('help');
        else if(matches.length===1)setInput(matches[0]);
        else{var common=matches.reduce(function(a,b){while(b.indexOf(a)!==0)a=a.slice(0,-1);return a;});if(common.length>prefix.length)setInput(common);showCompletions(matches);}
      }
    }else if(e.key==='Escape'){e.preventDefault();input.value='';syncInput();feedback('');}
  });
  var historyPanel=document.getElementById('history-panel');
  var historyInput=document.getElementById('history-input');
  var historyResults=document.getElementById('history-results');
  function renderHistory(){
    historyResults.replaceChildren();
    var seen=new Set();
    var matches=history.slice().reverse().filter(function(h){if(seen.has(h))return false;seen.add(h);return h.toLowerCase().includes(historyInput.value.toLowerCase());}).slice(0,8);
    if(!matches.length)line(historyResults,'No matching commands in this session.','muted small');
    matches.forEach(function(h){var b=el('button',h,'history-result');b.type='button';b.dataset.historySelect=h;historyResults.appendChild(b);});
  }
  function openHistory(){closeCompletions();historyPanel.hidden=false;historyInput.value='';renderHistory();historyInput.focus();historyPanel.scrollIntoView({block:'center',behavior:'instant'});}
  function closeHistory(){historyPanel.hidden=true;input.focus({preventScroll:true});}
  function useHistory(value){setInput(value);closeHistory();syncInput();}
  historyInput.addEventListener('input',renderHistory);
  historyPanel.addEventListener('submit',function(e){e.preventDefault();var first=historyResults.querySelector('[data-history-select]');if(first)useHistory(first.dataset.historySelect);});
  historyPanel.addEventListener('keydown',function(e){if(e.key==='Escape'){e.preventDefault();closeHistory();}});
  document.getElementById('history-close').addEventListener('click',closeHistory);
  try{var saved=localStorage.getItem('phosphor');if(themes.indexOf(saved)!==-1)setTheme(saved);}catch(e){}
  var initial={'/research.html':'research','/publications.html':'papers','/musings.html':'musings','/presentations.html':'talks','/teaching.html':'teaching'}[data.page];
  if(data.page.indexOf('/musings/')===0)initial='read';
  if(data.page==='/research.html' && location.hash){initial='research '+({'#gwas':'1','#wgs':'2','#methods':'3'}[location.hash] || '');}
  if(data.page==='/' && location.hash==='#about')initial='about';
  if(data.page==='/' && location.hash==='#news')initial='news';
  if(new URLSearchParams(location.search).get('play')==='tank')initial='tank';
  var readerFile=new URLSearchParams(location.search).get('read');
  if(readerFile&&/^[a-zA-Z0-9_.~/-]+$/.test(readerFile))initial='vim '+readerFile;
  if(!runRoute(hashRoute(),false)&&initial)run(initial,false);
  var followedURL=location.href;
  function followLocation(){if(followedURL===location.href)return;followedURL=location.href;var key=hashRoute();if(key)runRoute(key,true);else clearScreen();}
  window.addEventListener('popstate',followLocation);
  window.addEventListener('hashchange',followLocation);
  if(matchMedia('(pointer:fine)').matches)input.focus({preventScroll:true});
})();
