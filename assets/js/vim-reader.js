/* Read-only Vim-inspired navigation over the portfolio's virtual files. */
(function () {
  'use strict';
  var dialog, buffer, title, status, notice, commandForm, commandInput, commandPrefix, help;
  var lines=[], rows=[], current=0, query='', matches=[], matchIndex=-1, mode='normal', pendingG=false, commandComposing=false, previousFocus;
  function element(tag,text,cls){var n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;}
  function button(text,label,fn){var b=element('button',text);b.type='button';b.setAttribute('aria-label',label);b.addEventListener('click',fn);return b;}
  function say(text){notice.textContent=text;}
  function update(){
    status.textContent='NORMAL · READ ONLY';
    document.getElementById('vim-position').textContent=(current+1)+' / '+lines.length+' · '+Math.round((current+1)/lines.length*100)+'%';
    document.getElementById('vim-match-count').textContent=query?(matches.length?String(matchIndex+1)+' / '+matches.length+' matches':'No matches'):'';
  }
  function move(target,reveal){
    if(rows[current]){rows[current].classList.remove('vim-current');rows[current].removeAttribute('aria-current');}
    current=Math.max(0,Math.min(lines.length-1,target));rows[current].classList.add('vim-current');rows[current].setAttribute('aria-current','true');
    if(reveal!==false)rows[current].scrollIntoView({block:'nearest',behavior:'instant'});update();
  }
  function page(direction,fraction){
    buffer.scrollTop+=direction*Math.max(24,buffer.clientHeight*fraction);
    var top=buffer.getBoundingClientRect().top;
    var visible=rows.findIndex(function(row){return row.getBoundingClientRect().bottom>top;});
    if(visible>=0)move(visible,false);
  }
  function render(){
    buffer.replaceChildren();rows=[];matches=[];matchIndex=-1;
    lines.forEach(function(text,lineIndex){
      var row=element('div',undefined,'vim-line');row.id='vim-line-'+lineIndex;
      var number=element('span',String(lineIndex+1),'vim-line-number');number.setAttribute('aria-hidden','true');row.appendChild(number);
      var content=element('span',undefined,'vim-line-text'),cursor=0;
      var pattern=query?new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'giu'):null,found;
      while(pattern&&(found=pattern.exec(text))!==null){
        content.appendChild(document.createTextNode(text.slice(cursor,found.index)));
        var mark=element('mark',found[0]);content.appendChild(mark);matches.push({line:lineIndex,mark:mark});
        cursor=found.index+found[0].length;
      }
      content.appendChild(document.createTextNode(text.slice(cursor)||(!text?' ':'')));row.appendChild(content);
      row.addEventListener('click',function(){move(lineIndex);buffer.focus({preventScroll:true});});buffer.appendChild(row);rows.push(row);
    });
    move(current);
  }
  function selectMatch(index){
    if(!matches.length){say('Pattern not found: '+query);update();return;}
    if(matchIndex>=0)matches[matchIndex].mark.classList.remove('vim-active-match');
    matchIndex=(index+matches.length)%matches.length;var match=matches[matchIndex];match.mark.classList.add('vim-active-match');move(match.line);match.mark.scrollIntoView({block:'nearest',behavior:'instant'});say('Search: '+query+' · n next / N previous');update();
  }
  function normal(){mode='normal';pendingG=false;commandForm.hidden=true;buffer.focus({preventScroll:true});update();}
  function prompt(next){mode=next;pendingG=false;commandPrefix.textContent=next==='search'?'/':':';commandInput.setAttribute('aria-label',next==='search'?'Search file, literal text, case insensitive':'Vim command');commandInput.value='';commandForm.hidden=false;status.textContent=next==='search'?'SEARCH':'COMMAND';commandInput.focus();say(next==='search'?'Enter to search · Escape to cancel':'q quit · NUMBER jump · set nonumber · noh clear search');}
  function close(){if(dialog&&dialog.open)dialog.close();}
  function submit(){
    if(commandComposing)return;
    var value=commandInput.value.trim();
    if(mode==='search'){
      if(value){query=value;render();var first=matches.findIndex(function(m){return m.line>=current;});if(matches.length)selectMatch(first<0?0:first);else say('Pattern not found: '+query);}
      else if(query&&matches.length)selectMatch(matchIndex+1);
      normal();return;
    }
    if(['q','q!','quit','exit'].includes(value)){close();return;}
    normal();
    if(/^\d+$/.test(value)){move(Number(value)-1);say('Line '+(current+1));}
    else if(value==='noh'||value==='nohlsearch'){query='';render();say('Search cleared.');}
    else if(value==='set nonumber'||value==='set nonu'){buffer.classList.add('vim-no-numbers');say('Line numbers hidden.');}
    else if(value==='set number'||value==='set nu'){buffer.classList.remove('vim-no-numbers');say('Line numbers shown.');}
    else if(value==='help'){help.hidden=false;say('Reader shortcuts shown.');}
    else if(value==='w'||value==='wq'||value==='x'){say('Read-only portfolio file. Use :q to return to the terminal.');}
    else if(value){say('Unknown command: '+value+' · Try :help or :q');}
  }
  function build(){
    dialog=element('dialog',undefined,'vim-dialog');dialog.setAttribute('aria-labelledby','vim-title');
    var bar=element('header',undefined,'vim-bar');var name=element('div');name.appendChild(element('span','VIM / PORTFOLIO READER','vim-brand'));title=element('h2');title.id='vim-title';name.appendChild(title);bar.appendChild(name);
    var actions=element('div',undefined,'vim-actions');actions.append(button('/ Search','Search this file',function(){prompt('search');}),button('?','Show reader shortcuts',function(){help.hidden=!help.hidden;}),button(':q ×','Close reader',close));bar.appendChild(actions);dialog.appendChild(bar);
    help=element('div','j / k or arrows: move · gg / G: first / last line · Ctrl+D / Ctrl+U: half page · /: search · n / N: next / previous · :42: jump to line · :q or Esc: close. Select text to copy; files are read-only.','vim-help');help.id='vim-help';help.hidden=true;dialog.appendChild(help);
    buffer=element('div',undefined,'vim-buffer');buffer.tabIndex=0;buffer.setAttribute('role','region');buffer.setAttribute('aria-label','File contents. Use j and k to move; slash to search.');buffer.setAttribute('aria-describedby','vim-help');dialog.appendChild(buffer);
    var foot=element('div',undefined,'vim-status');status=element('span');var match=element('span');match.id='vim-match-count';var pos=element('span');pos.id='vim-position';foot.append(status,match,pos);dialog.appendChild(foot);
    commandForm=element('form',undefined,'vim-command');commandForm.hidden=true;commandForm.autocomplete='off';commandPrefix=element('label');commandPrefix.htmlFor='vim-command-input';commandInput=element('input');commandInput.id='vim-command-input';commandInput.autocomplete='off';commandInput.spellcheck=false;commandInput.maxLength=256;commandInput.setAttribute('autocapitalize','off');commandForm.append(commandPrefix,commandInput,button('↵','Submit reader command',submit));dialog.appendChild(commandForm);
    notice=element('p',undefined,'vim-notice');notice.setAttribute('role','status');dialog.appendChild(notice);
    var touch=element('div',undefined,'vim-touch');touch.append(button('↑','Previous line',function(){move(current-1);}),button('↓','Next line',function(){move(current+1);}),button('gg','First line',function(){move(0);}),button('G','Last line',function(){move(lines.length-1);}),button('n','Next search match',function(){selectMatch(matchIndex+1);}));dialog.appendChild(touch);
    document.body.appendChild(dialog);
    buffer.addEventListener('keydown',function(e){
      if(e.isComposing||e.metaKey||e.altKey)return;
      if(e.ctrlKey){if(e.key.toLowerCase()==='d'||e.key.toLowerCase()==='u'){e.preventDefault();page(e.key.toLowerCase()==='d'?1:-1,.5);}return;}
      var key=e.key;
      if(pendingG&&key==='g'){e.preventDefault();pendingG=false;move(0);say('Top of file.');return;}
      pendingG=false;
      if(key==='j'||key==='ArrowDown'){e.preventDefault();move(current+1);}
      else if(key==='k'||key==='ArrowUp'){e.preventDefault();move(current-1);}
      else if(key==='g'){e.preventDefault();pendingG=true;say('g… press g again for first line.');}
      else if(key==='G'||key==='End'){e.preventDefault();move(lines.length-1);}
      else if(key==='Home'){e.preventDefault();move(0);}
      else if(key==='PageDown'||key==='PageUp'){e.preventDefault();page(key==='PageDown'?1:-1,1);}
      else if(key==='/'||key===':'){e.preventDefault();prompt(key==='/'?'search':'command');}
      else if(key==='n'||key==='N'){e.preventDefault();if(query)selectMatch(matchIndex+(key==='n'?1:-1));else say('No search yet. Press / to search.');}
      else if(key==='?'){e.preventDefault();help.hidden=!help.hidden;}
      else if(key==='i'||key==='a'||key==='o'){e.preventDefault();say('Read-only mode. Use / to search or :q to return.');}
    });
    commandForm.addEventListener('submit',function(e){e.preventDefault();if(!e.isComposing)submit();});
    commandInput.addEventListener('compositionstart',function(){commandComposing=true;});
    commandInput.addEventListener('compositionend',function(){commandComposing=false;});
    commandInput.addEventListener('keydown',function(e){if(commandComposing||e.isComposing||e.keyCode===229){if(e.key==='Enter')e.preventDefault();return;}if(e.key==='Escape'){e.preventDefault();e.stopPropagation();normal();say('Cancelled.');}});
    dialog.addEventListener('cancel',function(e){e.preventDefault();if(mode!=='normal'){normal();say('Cancelled.');}else close();});
    dialog.addEventListener('close',function(){mode='normal';document.body.classList.remove('vim-open');if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});});
  }
  window.openVimReader=function(file){
    if(!dialog)build();previousFocus=document.activeElement;
    lines=String(file.text).replace(/\r\n?/g,'\n').split('\n');if(!lines.length)lines=[''];
    current=0;query='';matchIndex=-1;matches=[];mode='normal';pendingG=false;commandComposing=false;
    title.textContent=file.path;help.hidden=true;commandForm.hidden=true;buffer.classList.remove('vim-no-numbers');
    if(!dialog.open)dialog.showModal();document.body.classList.add('vim-open');render();buffer.scrollTop=0;buffer.focus();say('j/k move · / search · :q quit · ? shortcuts');
  };
})();
