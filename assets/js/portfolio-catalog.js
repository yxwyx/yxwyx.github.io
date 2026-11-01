/* Canonical portfolio records: display order never changes identifiers or citations. */
(function () {
  'use strict';
  window.createPortfolioCatalog = function (data, themes, readTemplate) {
    function year(paper) { return Number(paper.year || (paper.journal.match(/\b20\d{2}\b/) || [0])[0]); }
    function newest(records) { return records.slice().sort(function(a,b){return year(b)-year(a);}); }
    function featured(paper) { return paper.research_role==='First'||paper.research_role==='Co-first'; }
    function plain(text) { return String(text || '').replace(/\s+/g,' ').trim(); }
    var records=[], byKey=new Map();
    function add(record) {
      if(byKey.has(record.key))throw Error('Duplicate portfolio key: '+record.key);
      record.text=plain(record.text);record.title=plain(record.title);
      record.searchText=(record.title+' '+record.text).toLowerCase();
      records.push(record);byKey.set(record.key,record);
    }
    data.papers.forEach(function(p,i){add({key:'paper/'+p.doi,type:'paper',title:p.title,year:year(p),index:i,text:[p.authors,p.journal,p.doi,p.research_contribution,(p.research_tags||[]).join(' ')].join(' ')});});
    themes.forEach(function(t,i){add({key:'research/'+t.key,type:'research',title:t.title,index:i,text:t.description});});
    data.posts.forEach(function(p,i){add({key:'writing/'+p.url.split('/').filter(Boolean).pop(),type:'writing',title:p.title,year:Number(p.date.slice(0,4)),index:i,text:readTemplate('writing-'+i)});});
    var talkGroups=new Map();
    data.talks.forEach(function(t){
      var title=plain(t.title),key=title.toLowerCase();
      if(!talkGroups.has(key))talkGroups.set(key,{id:t.id,title:title,events:[]});
      talkGroups.get(key).events.push(t);
    });
    var talks=Array.from(talkGroups.values());
    talks.forEach(function(t){t.events.sort(function(a,b){return b.year-a.year;});});
    talks.sort(function(a,b){return b.events[0].year-a.events[0].year;});
    talks.forEach(function(t){
      var record={key:'talk/'+t.id,type:'talk',title:t.title,year:t.events[0].year,talk:t,text:t.events.map(function(e){return [e.year,e.venue,e.location].join(' ');}).join(' / ')};
      add(record);
      // Both original event URLs continue to resolve to the consolidated talk.
      t.events.forEach(function(e){byKey.set('talk/'+e.id,record);});
    });
    [['about','About Yuxuan Wang'],['news','News'],['teaching','Teaching']].forEach(function(pair){add({key:pair[0],type:'page',title:pair[1],text:readTemplate(pair[0]+'-source')});});
    add({key:'contact',type:'page',title:'Contact',text:'Google Scholar '+data.scholar+' GitHub '+data.github+' LinkedIn '+data.linkedin});
    function search(query) {
      var terms=Array.from(new Set(plain(query).toLowerCase().split(' ').filter(Boolean)));
      if(!terms.length)return [];
      return records.filter(function(r){return terms.every(function(t){return r.searchText.includes(t);});}).map(function(r){return {record:r,score:terms.reduce(function(n,t){return n+(r.title.toLowerCase().includes(t)?10:1);},0)};}).sort(function(a,b){return b.score-a.score||(b.record.year||0)-(a.record.year||0)||a.record.title.localeCompare(b.record.title);}).map(function(r){return r.record;});
    }
    function selectPapers(args) {
      if(!args.length||args.length===1&&args[0]==='--all')return newest(data.papers);
      if(args.length===1&&args[0]==='--featured')return newest(data.papers.filter(featured));
      if(args.length===2&&args[0]==='--year'&&/^\d{4}$/.test(args[1]))return newest(data.papers.filter(function(p){return year(p)===Number(args[1]);}));
      throw Error('Usage: papers [--all | --featured | --year YYYY]');
    }
    return {talks:talks,get:function(key){return byKey.get(key);},search:search,newest:newest,featured:featured,selectPapers:selectPapers,keys:function(){return Array.from(byKey.keys());}};
  };
})();
