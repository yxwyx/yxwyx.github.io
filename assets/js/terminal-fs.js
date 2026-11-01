/* A portfolio filesystem. Nothing here reads or executes on the visitor's machine. */
(function () {
  'use strict';
  window.createPortfolioShell = function (api) {
    var home='/home/yuxuan', cwd=home, previous=home;
    var fs=Object.create(null), started=Date.now();
    var data=api.data, el=api.el, line=api.line, heading=api.heading;
    var advanced=['vim','view','tank','snake','games','cd','pwd','ls','tree','cat','find','grep','man','neofetch','status','dna','fortune','papers --all','papers --featured','papers --year 2022','papers --year 2023','papers --year 2025'];
    var manual={
      search:['search <words>','Search publications, talks, essays, research and profile pages. All words must match; matching is case insensitive. Results link to individual items. Example: search rare variants.'],
      open:['open <item>','Open an item by its stable name. Tab completes available items. Paper links use DOI identifiers, so reordering never changes their destination.'],
      snake:['snake','Launch DNA Snake. Arrows, WASD or HJKL steer; P pauses; Escape exits. Touch arrows and swipe controls work on mobile. Collect bases, avoid walls and yourself.'],
      games:['games','List the arcade games. Select snake or tank to play.'],
      tank:['tank','Launch Tank / Base Defense. WASD or arrows move; Space/J fires; P pauses; Escape exits. Touch controls are below the battlefield. Protect your base and defeat all 18 enemies.'],
      vim:['vim <file> (or view <file>)','Open a read-only Vim-style reader. j/k: move; gg/G: first/last line; /: literal, case-insensitive search; n/N: next/previous match; :42: jump; :q: quit. Ctrl+D/U scroll half a page. ? shows help.'],
      cd:['cd [directory]','Navigate the portfolio filesystem. Supports ~, .., absolute paths, and cd - (previous directory).'],
      ls:['ls [-a] [directory]','List files. Add -a to reveal dotfiles. Select a directory or file to explore it.'],
      tree:['tree [-a] [directory]','Print the directory tree. Hidden files appear with -a.'],
      cat:['cat <file>','Read a file. Relative and absolute paths work. Tab completes file paths.'],
      find:['find [directory] [-name "*.md"]','Find portfolio files. The -name pattern supports * and ?.'],
      grep:['grep [-i] <text> <file>','Find matching lines. Patterns are literal text, not regular expressions. Quoted phrases work.'],
      papers:['papers [--all | --featured | --year YYYY]','Default: first/co-first-author highlights, then other publications; newest first within each group. --all: all listed papers by year. --featured: first/co-first-author papers. Pipes expose one searchable record per paper.'],
      pipes:['<command> | grep [-i] <text> | head [N]','Pipe papers, ls, tree, cat, find, pwd, or history into grep, head, sort, or wc -l. Example: papers | grep -i lipid | head 3.'],
      keyboard:['Keyboard shortcuts','Tab: complete commands/paths and open candidates. Enter inserts a selected candidate; Enter again runs it. Right arrow accepts a gray history suggestion. Up/Down: command history. Ctrl+R: search history. Ctrl+L: clear screen. Ctrl+C: cancel input. Ctrl+A/E: start/end. Ctrl+U/K/W: delete before/after cursor/previous word. Escape dismisses menus.'],
      dna:['dna','Print a small DNA-inspired ASCII sketch. Decorative, not a biological sequence.'],
      neofetch:['neofetch','A compact researcher profile and actual portfolio/session information.']
    };
    function add(path,node){fs[home+'/'+path]=node;}
    function dir(path){add(path,{type:'dir'});}
    function file(path,text,render){add(path,{type:'file',text:text,render:render});}
    function templateText(id){
      var source=document.getElementById(id).content.cloneNode(true);
      source.querySelectorAll('br').forEach(function(n){n.replaceWith(document.createTextNode('\n'));});
      source.querySelectorAll('h1,h2,h3,h4,p,li,blockquote,pre').forEach(function(n){n.appendChild(document.createTextNode('\n\n'));});
      return source.textContent.trim().replace(/\n[ \t]+/g,'\n').replace(/\n{3,}/g,'\n\n');
    }
    fs['/']={type:'dir'};fs['/home']={type:'dir'};fs[home]={type:'dir'};dir('research');dir('papers');dir('writing');dir('games');
    file('games/snake.txt','DNA / SNAKE\n\nCollect A, T, C and G. Each base extends your sequence.\nAvoid walls and yourself. Every five pickups increases speed.\n\nSteer: arrows / WASD / HJKL / touch arrows / swipe\nPause: P\nExit: Escape\nLaunch: snake',function(out){heading(out,'DNA / SNAKE','~/games/');line(out,'Build your sequence, one base at a time.');api.suggest(out,['snake','man snake']);});
    file('games/tank.txt','TANK / BASE DEFENSE\n\nMove: WASD or arrow keys\nFire: Space or J\nPause: P\nExit: Escape\n\nProtect the base. Three lives. Eighteen hostiles.\nBrick walls break; steel walls stop shots.\n\nLaunch: tank',function(out){heading(out,'TANK / BASE DEFENSE','~/games/');line(out,'Defend the base. Break through brick walls. Outlast 18 enemies.');api.suggest(out,['tank','man tank']);});
    file('README.txt','Yuxuan Wang / statistical genetics\n\nStart: whoami\nExplore: tree\nRead: cat about.txt\nReader: vim papers.bib\nSearch: papers | grep -i lipid\nHidden files: ls -a\nManual: man pipes\n\nThis filesystem contains portfolio content.');
    file('about.txt',templateText('about-source'),function(out){api.template(out,'about-source');});
    file('news.log',templateText('news-source'),function(out){api.template(out,'news-source');});
    file('teaching.txt',templateText('teaching-source'),function(out){api.template(out,'teaching-source');});
    file('contact.txt','Google Scholar: '+data.scholar+'\nGitHub: '+data.github+'\nLinkedIn: '+data.linkedin,function(out){[['Google Scholar',data.scholar],['GitHub',data.github],['LinkedIn',data.linkedin]].forEach(function(v){var p=el('p');api.link(p,v[0]+' ↗',v[1]);out.appendChild(p);});});
    file('.plan','> Questions I keep coming back to\n\nHow do common and rare variants shape cardiometabolic traits?\nWhich genes do association signals implicate?\nWhat makes a signal replicate across studies and populations?\n\n$ research 3');
    file('.motd','You found the dotfiles.\n\nThere are no secret credentials here.\nJust a statistical geneticist with a terminal-shaped website.\n\nTry: dna\nOr: fortune');
    api.themes.forEach(function(t,i){file('research/'+t.key+'.md',t.title+'\n\n'+t.description,function(out){api.research(out,String(i+1));});});
    file('research.md',api.themes.map(function(t){return t.title+'\n'+t.description;}).join('\n\n'),function(out){api.research(out,'');});
    file('papers.bib',data.papers.filter(function(p){return p.bibtex;}).map(function(p){return p.bibtex;}).join('\n\n'));
    data.papers.forEach(function(p,i){
      var year=(p.journal.match(/\b20\d{2}\b/)||['undated'])[0];
      var basename=String(i+1).padStart(2,'0')+'-'+year;
      file('papers/'+basename+'.txt',p.title+'\n'+p.authors+'\n'+p.journal+'\nDOI: '+p.doi+'\n'+p.website,function(out){api.listPapers(out,[p]);});
      if(p.bibtex)file('papers/'+basename+'.bib',p.bibtex);
    });
    file('talks.txt',data.talks.map(function(t){return t.year+' | '+t.venue+' | '+t.location+'\n'+t.title;}).join('\n\n'));
    data.posts.forEach(function(p,i){
      var name=p.url.split('/').filter(Boolean).pop()+'.md';
      var source=document.getElementById('writing-'+i);
      file('writing/'+name,source?templateText('writing-'+i):p.title+'\n'+p.excerpt,function(out){
        if(source)out.appendChild(source.content.cloneNode(true));else api.link(out,p.title,p.url);
      });
    });
    function path(input){
      var s=input||cwd;if(s==='~')return home;if(s.startsWith('~/'))s=home+s.slice(1);if(!s.startsWith('/'))s=cwd+'/'+s;
      var parts=[];s.split('/').forEach(function(p){if(p==='..')parts.pop();else if(p&&p!=='.')parts.push(p);});
      return '/'+parts.join('/');
    }
    function display(p){return p===home?'~':p.startsWith(home+'/')?'~'+p.slice(home.length):p;}
    function children(p,hidden){return Object.keys(fs).filter(function(k){return k!==p&&(k.slice(0,k.lastIndexOf('/'))||'/')===p&&(hidden||!k.split('/').pop().startsWith('.'));}).sort(function(a,b){return (fs[a].type==='dir'?0:1)-(fs[b].type==='dir'?0:1)||a.localeCompare(b);});}
    function requireNode(p,type){if(!fs[p])throw Error('No such portfolio path: '+display(p));if(type&&fs[p].type!==type)throw Error(type==='dir'?'Not a directory: '+display(p):'Is a directory: '+display(p));return fs[p];}
    function tokenize(raw){
      var segments=[[]],word='',quote=null,active=false;
      for(var i=0;i<raw.length;i++){
        var c=raw[i];
        if(quote){if(c===quote)quote=null;else word+=c;active=true;}
        else if(c==='"'||c==="'"){quote=c;active=true;}
        else if(c==='|'){if(active){segments[segments.length-1].push(word);word='';active=false;}segments.push([]);}
        else if(/\s/.test(c)){if(active){segments[segments.length-1].push(word);word='';active=false;}}
        else{word+=c;active=true;}
      }
      if(quote)throw Error('Unclosed quote. Close it and try again.');
      if(active)segments[segments.length-1].push(word);
      if(segments.some(function(s){return !s.length;}))throw Error('Missing command before or after |.');
      return segments;
    }
    function options(args,flag){var copy=args.slice(),idx=copy.indexOf(flag);if(idx>=0)copy.splice(idx,1);return {enabled:idx>=0,args:copy};}
    function treeLines(p,hidden){var lines=[display(p)+'/'];function walk(p,prefix){var nodes=children(p,hidden);nodes.forEach(function(k,i){var last=i===nodes.length-1;lines.push(prefix+(last?'└── ':'├── ')+k.split('/').pop()+(fs[k].type==='dir'?'/':''));if(fs[k].type==='dir')walk(k,prefix+(last?'    ':'│   '));});}walk(p,'');return lines;}
    function paperSelection(args){return api.selectPapers(args);}
    function findPaths(args){
      var root=cwd,pattern='*',a=args.slice();if(a[0]&&!a[0].startsWith('-'))root=path(a.shift());requireNode(root,'dir');
      if(a.length){if(a.length!==2||a[0]!=='-name')throw Error('Usage: find [directory] [-name "*.md"]');pattern=a[1];}
      var regex=new RegExp('^'+pattern.split('').map(function(c){return c==='*'?'.*':c==='?'?'.':c.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}).join('')+'$');
      return Object.keys(fs).filter(function(k){return k.startsWith(root==='/'?'/':root+'/')&&fs[k].type==='file'&&regex.test(k.split('/').pop());}).sort();
    }
    function filterLines(lines,args){var o=options(args,'-i');if(o.args.length!==1)throw Error('Usage in a pipe: grep [-i] "text"');var needle=o.args[0];return lines.filter(function(l){return o.enabled?l.toLowerCase().includes(needle.toLowerCase()):l.includes(needle);});}
    function textOutput(tokens){
      var cmd=tokens[0].toLowerCase(),args=tokens.slice(1),p,o;
      if(cmd==='papers'||cmd==='publications')return paperSelection(args).map(function(p){return p.journal+' | '+p.title+' | '+p.doi;});
      if(cmd==='cat'){if(args.length!==1)throw Error('Usage: cat <file>');return requireNode(path(args[0]),'file').text.split('\n');}
      if(cmd==='ls'){o=options(args,'-a');if(o.args.length>1)throw Error('Usage: ls [-a] [directory]');p=path(o.args[0]);requireNode(p,'dir');return children(p,o.enabled).map(function(k){return k.split('/').pop()+(fs[k].type==='dir'?'/':'');});}
      if(cmd==='tree'){o=options(args,'-a');if(o.args.length>1)throw Error('Usage: tree [-a] [directory]');p=path(o.args[0]);requireNode(p,'dir');return treeLines(p,o.enabled);}
      if(cmd==='pwd')return [cwd];
      if(cmd==='history')return api.history().map(function(h,i){return String(i+1).padStart(3,' ')+'  '+h;});
      if(cmd==='find')return findPaths(args).map(display);
      if(cmd==='grep'){o=options(args,'-i');if(o.args.length!==2)throw Error('Usage: grep [-i] "text" <file>');var lines=requireNode(path(o.args[1]),'file').text.split('\n');return filterLines(lines,(o.enabled?['-i']:[]).concat(o.args[0]));}
      throw Error('Cannot pipe '+cmd+'. Try papers, cat, ls, tree, find, grep, pwd, or history.');
    }
    function execute(raw,out){
      var parsed;
      try{parsed=tokenize(raw);}catch(e){line(out,e.message,'error');return true;}
      var cmd=parsed[0][0].toLowerCase(),args=parsed[0].slice(1);
      if(parsed.length===1&&!['cd','pwd','ls','tree','cat','find','grep','man','neofetch','status','dna','fortune','tank','snake','games','vim','view','search','open'].includes(cmd)&&!((cmd==='papers'||cmd==='publications')&&args.length))return false;
      try{
        if(parsed.length>1){
          var lines=textOutput(parsed[0]);
          parsed.slice(1).forEach(function(stage){var c=stage[0],a=stage.slice(1);if(c==='grep')lines=filterLines(lines,a);else if(c==='head'){if(a[0]==='-n')a.shift();if(a.length>1||(a.length&&!/^\d+$/.test(a[0])))throw Error('Usage: head [N] or head -n N');lines=lines.slice(0,a.length?Math.min(1000,Number(a[0])):10);}else if(c==='sort'&&!a.length)lines=lines.slice().sort();else if(c==='wc'&&a.join(' ')==='-l')lines=[String(lines.length)];else throw Error('Supported pipe stages: grep, head, sort, wc -l.');});
          out.appendChild(el('pre',lines.length?lines.join('\n'):'(no matches)','shell-text'));return true;
        }
        if(cmd==='search'){
          api.search(out,args.join(' '));
        }else if(cmd==='open'){
          if(args.length!==1)throw Error('Usage: open <item>');api.open(out,args[0]);
        }else if(cmd==='games'){
          heading(out,'Choose a cartridge.','~/games/');line(out,'DNA Snake — collect bases and grow your sequence.');line(out,'Tank / Base Defense — protect the base from 18 enemies.');api.suggest(out,['snake','tank']);
        }else if(cmd==='snake'){
          if(args.length)throw Error('Usage: snake');
          line(out,'Loading DNA / SNAKE…','bright');api.suggest(out,['snake','games']);
          api.launch(function(){window.openSnakeGame();});
        }else if(cmd==='tank'){
          line(out,'Launching TANK / BASE DEFENSE…','bright');api.suggest(out,['tank']);
          api.launch(function(){window.openTankGame();});
        }else if(cmd==='vim'||cmd==='view'){
          if(args.length!==1)throw Error('Usage: '+cmd+' <file>');
          var readerPath=path(args[0]),readerNode=requireNode(readerPath,'file');
          line(out,'Opening '+display(readerPath)+' · :q returns to the terminal.','muted');
          api.launch(function(){window.openVimReader({path:display(readerPath),text:readerNode.text});});
        }else if(cmd==='cd'){
          if(args.length>1)throw Error('Usage: cd [directory]');var next=args[0]==='-'?previous:path(args[0]||'~');requireNode(next,'dir');previous=cwd;cwd=next;
          document.querySelector('#command-form .prompt-path').textContent=':'+display(cwd);
          line(out,display(cwd),'muted');api.suggest(out,['ls','tree','cd ~']);
        }else if(cmd==='ls'){
          var o=options(args,'-a');if(o.args.length>1)throw Error('Usage: ls [-a] [directory]');var p=path(o.args[0]);requireNode(p,'dir');heading(out,display(p)+'/','directory');
          children(p,o.enabled).forEach(function(k){var row=el('div',null,'file-row');row.appendChild(el('span',fs[k].type==='dir'?'dr-xr-xr-x':'-r--r--r--','file-mode'));api.commandButton(row,k.split('/').pop()+(fs[k].type==='dir'?'/':''),(fs[k].type==='dir'?'cd ':'cat ')+display(k));row.appendChild(el('span',fs[k].type==='dir'?'<DIR>':new Blob([fs[k].text]).size+' B','file-size'));out.appendChild(row);});
          line(out,'','muted');
        }else if(cmd==='cat'){
          if(args.length!==1)throw Error('Usage: cat <file>');var p=path(args[0]),node=requireNode(p,'file');heading(out,p.split('/').pop(),display(p));if(node.render)node.render(out);else out.appendChild(el('pre',node.text,'shell-text'));
        }else if(cmd==='find'){
          var found=findPaths(args);found.forEach(function(p){var row=el('p');api.commandButton(row,display(p),'cat '+display(p));out.appendChild(row);});if(!found.length)line(out,'(no matching files)','muted');
        }else if(['pwd','tree','grep'].includes(cmd)){out.appendChild(el('pre',textOutput(parsed[0]).join('\n')||'(no matches)','shell-text'));
        }else if(cmd==='papers'||cmd==='publications'){
          api.paperView(out,args);
        }else if(cmd==='man'){
          var name=args[0]||'keyboard',m=manual[name];if(!m){heading(out,'Available manual pages');api.suggest(out,Object.keys(manual).map(function(k){return 'man '+k;}));}else{heading(out,name.toUpperCase()+'(1)','YW/OS manual');line(out,m[0],'tagline');line(out,m[1]);}
        }else if(cmd==='neofetch'){
          var fetch=el('div',null,'neofetch');fetch.appendChild(el('pre','     ╱╲      ╱╲\n    ╱  ╲    ╱  ╲\n   ╱    ╲  ╱    ╲\n   ╲     ╳      ╱\n    ╲   ╱ ╲    ╱\n     ╲ ╱   ╲  ╱\n      ╳     ╳\n     ╱ ╲   ╱ ╲\n    ╱   ╲ ╱   ╲\n   ╱     ╳     ╲','fetch-art'));
          var info=el('div');heading(info,'yuxuan@statgen');[['OS','YW/OS · portfolio shell'],['Host','Broad Institute / Natarajan Lab'],['Research','Human genetics & cardiometabolic traits'],['Language','R'],['Methods','GWAS · rare variants · Bayesian inference'],['Index',data.papers.length+' publications / '+data.posts.length+' essays'],['Session',Math.floor((Date.now()-started)/1000)+' seconds'],['Phosphor',document.documentElement.dataset.phosphor]].forEach(function(r){var row=el('p',null,'fetch-row');row.append(el('span',r[0],'fetch-key'),document.createTextNode(r[1]));info.appendChild(row);});var palette=el('div',null,'fetch-palette');['#51432c','#a89069','#e6b96c','#ffd89a','#35503d','#8bca99','#b9c3d0','#e8edf4'].forEach(function(c){var sw=el('i');sw.style.background=c;palette.appendChild(sw);});info.appendChild(palette);fetch.appendChild(info);out.appendChild(fetch);api.suggest(out,['tree','ls -a','man pipes']);
        }else if(cmd==='status'){
          heading(out,'Session status');line(out,'cwd       '+cwd);line(out,'uptime    '+Math.floor((Date.now()-started)/1000)+'s');line(out,'commands  '+api.history().length);line(out,'files     '+Object.values(fs).filter(function(n){return n.type==='file';}).length);line(out,'access    read-only portfolio');
        }else if(cmd==='dna'){
          var rows=[];for(var i=0;i<28;i++){var phase=i*Math.PI/7,a=Math.round(13+11*Math.sin(phase)),b=Math.round(13-11*Math.sin(phase)),lo=Math.min(a,b),hi=Math.max(a,b);rows.push(' '.repeat(lo)+(a<=b?'A':'T')+'─'.repeat(Math.max(0,hi-lo-1))+(hi===lo?'':'G')+' '.repeat(26-hi));}heading(out,'A little structure in the noise.','decorative sequence art · not biological data');out.appendChild(el('pre',rows.join('\n'),'dna-art'));api.suggest(out,['fortune','research 2']);
        }else if(cmd==='fortune'){
          var fortunes=['Keep the raw data immutable. Let the hypotheses change.','A small p-value is the beginning of a question.','Somewhere, a phenotype definition is more important than a bigger GPU.','The real treasure was the well-matched LD reference.','May your alleles align and your jobs finish before the weekend.'];line(out,fortunes[Math.floor(Math.random()*fortunes.length)],'tagline');
        }
      }catch(e){line(out,e.message,'error');}
      return true;
    }
    function complete(value){
      var last=value.lastIndexOf('|'),lead=last>=0?value.slice(0,last+1)+' ':'';
      var part=last>=0?value.slice(last+1).trimStart():value;
      if(!part.includes(' '))return (last>=0?['grep','head','sort','wc -l']:api.commands.concat(advanced)).filter(function(c,i,a){return a.indexOf(c)===i&&c.startsWith(part);}).map(function(c){return lead+c;});
      var prefix=part.slice(0,part.lastIndexOf(' ')+1),fragment=part.slice(part.lastIndexOf(' ')+1),cmd=part.split(' ')[0];
      if(cmd==='open')return api.contentKeys().filter(function(k){return k.startsWith(fragment);}).map(function(k){return lead+prefix+k;});
      if(!['cd','cat','vim','view','ls','tree','find'].includes(cmd))return api.commands.concat(advanced).filter(function(c){return c.startsWith(value);});
      var slash=fragment.lastIndexOf('/'),typedDir=slash>=0?fragment.slice(0,slash+1):'',start=slash>=0?fragment.slice(slash+1):fragment,p=path(typedDir||'.');
      if(!fs[p]||fs[p].type!=='dir')return [];
      return children(p,true).filter(function(k){return k.split('/').pop().startsWith(start)&&(cmd!=='cd'||fs[k].type==='dir');}).map(function(k){return lead+prefix+typedDir+k.split('/').pop()+(fs[k].type==='dir'?'/':'');});
    }
    return {execute:execute,complete:complete,path:function(){return display(cwd);}};
  };
})();
