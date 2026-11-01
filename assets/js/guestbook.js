/* One shared public guestbook. No visitor messages or credentials are stored here. */
(function(){
  'use strict';
  var dialog,host,status,retry,previousFocus,config,loading=false,loaded=false,controller,timer,embedTimer;
  var origin='https://giscus.app';
  function node(tag,text,cls){var n=document.createElement(tag);if(text)n.textContent=text;if(cls)n.className=cls;return n;}
  function fallback(){clearTimeout(embedTimer);loading=false;loaded=false;status.textContent='Read and leave a message on GitHub using the link below.';retry.hidden=false;}
  function load(){
    if(loaded||loading)return;
    loading=true;retry.hidden=true;status.textContent='Loading messages…';host.replaceChildren();
    controller=new AbortController();timer=setTimeout(function(){controller.abort();},8000);
    fetch(origin+'/api/discussions/categories?repo='+encodeURIComponent(config.repo),{signal:controller.signal,credentials:'omit'})
      .then(function(response){if(!response.ok)throw Error('Guestbook unavailable');return response.json();})
      .then(function(result){
        if(result.repositoryId!==config.repo_id||!result.categories.some(function(c){return c.id===config.category_id;}))throw Error('Guestbook unavailable');
        var script=document.createElement('script');script.src=origin+'/client.js';script.async=true;script.crossOrigin='anonymous';
        var attributes={repo:config.repo,'repo-id':config.repo_id,category:config.category,'category-id':config.category_id,mapping:'number',term:String(config.discussion_number),'reactions-enabled':'0','emit-metadata':'1','input-position':'top',theme:'dark',lang:'en',loading:'eager'};
        Object.keys(attributes).forEach(function(key){script.setAttribute('data-'+key,attributes[key]);});
        script.onerror=function(){host.replaceChildren();fallback();};
        script.onload=function(){clearTimeout(embedTimer);loading=false;loaded=true;status.textContent='Messages are public. Sign in with GitHub to post.';};
        embedTimer=setTimeout(function(){host.replaceChildren();fallback();},10000);
        host.appendChild(script);
      }).catch(fallback).finally(function(){clearTimeout(timer);});
  }
  function build(){
    config=JSON.parse(document.getElementById('portfolio-data').textContent).guestbook;
    dialog=node('dialog',null,'guestbook-dialog');dialog.setAttribute('aria-labelledby','guestbook-title');
    var header=node('header',null,'guestbook-header'),title=node('h2','Guestbook');title.id='guestbook-title';
    var close=node('button','Esc ×');close.type='button';close.setAttribute('aria-label','Close guestbook');close.addEventListener('click',function(){dialog.close();});header.append(title,close);dialog.append(header);
    dialog.append(node('p','Leave a hello, a research question, or a note about the games.','guestbook-intro'));
    dialog.append(node('p','Messages are public and linked to your GitHub profile.','muted small'));
    status=node('p',null,'guestbook-status');status.setAttribute('role','status');dialog.append(status);
    host=node('div',null,'giscus');dialog.append(host);
    var actions=node('div',null,'guestbook-actions'),link=node('a','Read & sign on GitHub ↗');link.href=config.discussion_url;link.target='_blank';link.rel='noopener noreferrer';actions.append(link);
    retry=node('button','Retry loading comments');retry.type='button';retry.hidden=true;retry.addEventListener('click',load);actions.append(retry);dialog.append(actions);document.body.append(dialog);
    dialog.addEventListener('cancel',function(e){e.preventDefault();dialog.close();});
    dialog.addEventListener('close',function(){document.body.classList.remove('guestbook-open');if(previousFocus&&previousFocus.isConnected)previousFocus.focus({preventScroll:true});});
    window.addEventListener('message',function(event){
      var frame=host.querySelector('iframe.giscus-frame');
      if(event.origin!==origin||!frame||event.source!==frame.contentWindow||!event.data||typeof event.data.giscus!=='object'||!event.data.giscus)return;
      if(event.data.giscus.error){host.replaceChildren();fallback();}
    });
  }
  window.openGuestbook=function(){
    if(!dialog)build();if(dialog.open)return;
    previousFocus=document.activeElement;dialog.showModal();document.body.classList.add('guestbook-open');load();
  };
})();
