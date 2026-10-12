// PinPoint server: AI research/deck proxy (/deck), sign-ups (/signup) and feedback (/feedback).
// Browser -> this server -> Anthropic API. The API key stays on the server. Sign-ups and feedback are saved as JSON lines in ./data (or DATA_DIR).
// Run: ANTHROPIC_API_KEY=... ALLOWED_ORIGIN=https://your-site.example node proxy.js
'use strict';
const http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const KEY=process.env.ANTHROPIC_API_KEY,ORIGIN=process.env.ALLOWED_ORIGIN,ADMIN_TOKEN=process.env.ADMIN_TOKEN,PORT=+process.env.PORT||8787;
const MODEL=process.env.ANTHROPIC_MODEL||'claude-sonnet-5-5',LIMIT=+process.env.HOURLY_LIMIT||8;
if(!ORIGIN){console.error('Set ALLOWED_ORIGIN first.');process.exit(1)}
const TPLS='Pitch deck, Investor deck, Business report, Lesson, Proposal, Event, Product launch, Marketing plan, Case study, Impact report, Workshop';
const prompt=(idea,n)=>`You are a presentation designer and writer. Turn this idea into a complete, ready-to-present deck of about ${n} slides.

IDEA: ${idea}

Reply with ONE JSON object and nothing else (no markdown fences):
{"template":"<one of: ${TPLS}>","why":"<one sentence on why this template suits the idea>","slides":[...]}

Each slide is one of:
{"kind":"title","title":"...","sub":"one-line promise"}
{"kind":"bullets","title":"...","items":["3 to 5 short points, each under 90 characters"]}
{"kind":"stats","title":"...","stats":[{"v":"big number or value","l":"what it measures"}]}  (2 to 4 stats)
{"kind":"quote","title":"who said it","sub":"the quote"}
{"kind":"steps","title":"Roadmap or How it works","items":["3 to 5 ordered steps"]}
{"kind":"section","title":"a bold divider statement"}
{"kind":"closing","title":"Thank you or Contact","sub":"call to action"}
Every slide may also have "notes": 1 to 3 sentences the speaker can say.

Rules: start with a title slide and end with a closing slide. Use a variety of kinds. Write specific, persuasive, real-world content for the idea, in plain words, with titles under 50 characters. Never invent statistics, names or facts about real organisations. Where a number would help, write an illustrative placeholder in square brackets such as [30%] so the person can replace it. Write in the same language as the idea.`; // keep identical to DECK_PROMPT in index.html
const researchPrompt=(idea,n)=>'Research this topic on the live web before writing the deck. Search multiple independent, credible sources. Prefer primary research, official statistics, government, universities, and reputable organizations. Compare dates and note disagreement or uncertainty. Then write a useful '+n+'-slide presentation grounded in the research.\nIDEA: '+idea+'\nNever invent facts, statistics, quotes, sources, or organizations. Use claims supported by sources. If strong evidence is unavailable, say so or use a clearly marked placeholder. Keep slide text concise and specific. Put source titles, publication dates, and URLs in speaker notes on relevant slides. Start with a title slide and end with a closing slide. Include varied layouts and choose one template from: '+TPLS+'.\nReply with one JSON object only, no markdown: {"template":"<template name>","why":"<one sentence>","slides":[{"kind":"title","title":"...","sub":"..."},{"kind":"bullets","title":"...","items":["..."],"notes":"Evidence and source attribution..."},{"kind":"closing","title":"...","sub":"..."}]}';const DATA=process.env.DATA_DIR||path.join(__dirname,'data');fs.mkdirSync(DATA,{recursive:true});
const MAXFILE=10*1024*1024,EMAIL=/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/;
const clean=(v,n)=>(typeof v==='string'?v:'').replace(/[\u0000-\u001F\u007F​-‏‪-‮]/g,' ').replace(/\s+/g,' ').trim().slice(0,n);
const hits=new Map();
function limited(key,max){const now=Date.now(),a=(hits.get(key)||[]).filter(t=>now-t<36e5);a.push(now);hits.set(key,a);return a.length>max}
function send(res,code,obj){if(res.headersSent)return;res.writeHead(code,{'Content-Type':'application/json','Access-Control-Allow-Origin':ORIGIN,'Vary':'Origin','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(JSON.stringify(obj))}
function store(file,rec,res){ // append one validated record; refuse when the file is too large
  const f=path.join(DATA,file);
  try{if(fs.existsSync(f)&&fs.statSync(f).size>MAXFILE)return send(res,507,{error:'Storage full'})}catch(e){}
  fs.appendFile(f,JSON.stringify(rec)+'\n',{mode:0o600},err=>err?send(res,500,{error:'Server error'}):send(res,200,{ok:true}));
}
http.createServer((req,res)=>{
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':ORIGIN,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type, Authorization','Vary':'Origin'});return res.end()}
  const route=req.url;
  if(route==='/admin'&&req.method==='GET'){
    if(req.headers.origin!==ORIGIN)return send(res,403,{error:'Origin not allowed'});
    if(!ADMIN_TOKEN)return send(res,503,{error:'Admin access is not configured'});
    const auth=String(req.headers.authorization||''),supplied=auth.startsWith('Bearer ')?auth.slice(7):'';
    const a=Buffer.from(supplied),b=Buffer.from(ADMIN_TOKEN);if(a.length!==b.length||!crypto.timingSafeEqual(a,b))return send(res,401,{error:'Unauthorized'});
    if(limited('admin|'+(req.socket.remoteAddress||''),60))return send(res,429,{error:'Too many requests'});
    const read=file=>{try{return fs.readFileSync(path.join(DATA,file),'utf8').split(/\r?\n/).filter(Boolean).slice(-500).map(line=>JSON.parse(line)).reverse()}catch(e){return []}};
    return send(res,200,{feedback:read('feedback.jsonl'),signups:read('signups.jsonl')});
  }
  if(req.method!=='POST'||!['/deck','/feedback','/signup'].includes(route))return send(res,404,{error:'Not found'});
  if(req.headers.origin!==ORIGIN)return send(res,403,{error:'Origin not allowed'});
  const ip=(process.env.TRUST_PROXY&&String(req.headers['x-forwarded-for']||'').split(',')[0].trim())||req.socket.remoteAddress;
  if(limited(route+'|'+ip,route==='/deck'?LIMIT:10))return send(res,429,{error:'Too many requests. Try again later.'});
  let body='',dead=false;
  req.on('data',c=>{body+=c;if(body.length>4096&&!dead){dead=true;send(res,413,{error:'Too large'});req.destroy()}});
  req.on('end',async()=>{
    if(dead)return;
    try{
      const j=JSON.parse(body);
      if(route==='/feedback'){
        const rating=j.rating,name=clean(j.name,60),msg=clean(j.msg,1000),contact=clean(j.contact,120);
        if(!name||!Number.isInteger(rating)||rating<1||rating>5||msg.length<3||(contact&&!EMAIL.test(contact)))return send(res,400,{error:'Bad request'});
        return store('feedback.jsonl',{rating,name,msg,contact,uses:Number.isInteger(j.uses)?Math.min(j.uses,9999):0,at:new Date().toISOString()},res);
      }
      if(route==='/signup'){
        const name=clean(j.name,60),email=clean(j.email,120).toLowerCase();
        if(!name||!EMAIL.test(email))return send(res,400,{error:'Bad request'});
        return store('signups.jsonl',{name,email,at:new Date().toISOString()},res);
      }
      const {idea,count}=j,research=j.research===true;
      if(typeof idea!=='string'||idea.length<8||idea.length>500||!Number.isInteger(count)||count<4||count>14)return send(res,400,{error:'Bad request'});
      if(!KEY)return send(res,503,{error:'AI service is not configured'});
      const safeIdea=idea.replace(/[\u0000-\u001F]/g,' ');
      const payload={model:MODEL,max_tokens:research?6000:4000,messages:[{role:'user',content:research?researchPrompt(safeIdea,count):prompt(safeIdea,count)}]};
      if(research)payload.tools=[{type:'web_search_20250305',name:'web_search',max_uses:6}];
      const r=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',signal:AbortSignal.timeout(180000),
        headers:{'x-api-key':KEY,'anthropic-version':'2023-06-01','content-type':'application/json'},body:JSON.stringify(payload)});
      if(!r.ok)return send(res,502,{error:'AI service error'});
      const out=await r.json(),blocks=out.content||[],sources=new Map();
      for(const b of blocks){for(const c of b.citations||[])if(c.url&&c.url.startsWith('https://'))sources.set(c.url,{title:clean(c.title,160),url:c.url});if(b.type==='web_search_tool_result'&&Array.isArray(b.content))for(const c of b.content)if(c.url&&c.url.startsWith('https://'))sources.set(c.url,{title:clean(c.title,160),url:c.url})}
      send(res,200,{text:blocks.filter(b=>b.type==='text').map(b=>b.text||'').join('\n'),sources:[...sources.values()].slice(0,12)});
    }catch(e){const bad=e instanceof SyntaxError;send(res,bad?400:500,{error:bad?'Bad request':'Server error'})}
  });
}).listen(PORT,()=>console.log('PinPoint server on port '+PORT));
