// v8 — Minimal + Colorful Contrast + Detailed Logs/Errors; Author: 24DS1000034-George
// Requirements satisfied: browser input, LLM query, OpenAI-style tool calls, loop until done, three tools.
// AiPipe default provider. Minimal UI with contrast. Built-in logs pane.

const els = {
  chat: document.getElementById('chat'),
  input: document.getElementById('userInput'),
  send: document.getElementById('sendBtn'),
  alerts: document.getElementById('alerts'),
  provider: document.getElementById('provider'),
  baseUrl: document.getElementById('baseUrl'),
  apiKey: document.getElementById('apiKey'),
  modelSelect: document.getElementById('modelSelect'),
  googleKey: document.getElementById('googleKey'),
  googleCx: document.getElementById('googleCx'),
  aipipeUrl: document.getElementById('aipipeUrl'),
  maxLoops: document.getElementById('maxLoops'),
  computedUrl: document.getElementById('computedUrl'),
  btnLogs: document.getElementById('btnLogs'),
  btnClear: document.getElementById('btnClear'),
  btnCopyLogs: document.getElementById('btnCopyLogs'),
  btnClearLogs: document.getElementById('btnClearLogs'),
  btnCloseLogs: document.getElementById('btnCloseLogs'),
  logsDrawer: document.getElementById('logsDrawer'),
  logs: document.getElementById('logs'),
  status: document.getElementById('status'),
};

// Providers (minimal)
const PROVIDERS = {
  aipipe: { baseUrl:'https://your-aipipe.example.com/openai', models:['gpt-4o-mini','llama-3.1-70b-instruct'] },
  openai: { baseUrl:'https://api.openai.com', models:['gpt-4o-mini','gpt-4.1-mini'] },
  custom: { baseUrl:'', models:['your-model-here'] },
};

// OpenAI tool schema
const toolsSpec = [
  { type:'function', function:{ name:'google_search', description:'Return snippet results via Google CSE', parameters:{ type:'object', properties:{ query:{type:'string'}, num:{type:'integer', default:5, minimum:1, maximum:10}}, required:['query'] } } },
  { type:'function', function:{ name:'aipipe_run', description:'Call AiPipe proxy with {flow,payload}', parameters:{ type:'object', properties:{ flow:{type:'string'}, payload:{type:'object'}, endpoint:{type:'string'}}, required:['flow','payload'] } } },
  { type:'function', function:{ name:'run_js', description:'Execute JS in sandboxed Worker', parameters:{ type:'object', properties:{ code:{type:'string'}, timeout_ms:{type:'integer', default:2000, minimum:100}}, required:['code'] } } },
];

// Messages
const messages = [{ role:'system', content:'You are a minimal browser LLM agent. Use tools when helpful. Keep answers concise.' }];

// ----- UI helpers -----
function esc(s){ return String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function addMsg(kind, text){ const el=document.createElement('div'); el.className=`p-2 mb-2 msg ${kind}`; el.innerHTML=esc(text); els.chat.appendChild(el); els.chat.scrollTop=els.chat.scrollHeight; }
function addTool(title, obj){ const el=document.createElement('div'); el.className='p-2 mb-2 msg tool'; el.innerHTML=`<div class="fw-semibold">${esc(title)}</div><pre class="m-0">${esc(JSON.stringify(obj,null,2))}</pre>`; els.chat.appendChild(el); els.chat.scrollTop=els.chat.scrollHeight; }
function alertBox(msg, variant='warning'){ const id='al_'+Math.random().toString(36).slice(2); els.alerts.insertAdjacentHTML('beforeend', `<div id="${id}" class="alert alert-${variant} alert-dismissible fade show" role="alert">${esc(msg)}<button type="button" class="btn-close" data-bs-dismiss="alert"></button></div>`); setTimeout(()=>{ const el=document.getElementById(id); if(el) bootstrap.Alert.getOrCreateInstance(el).close(); }, 6000); }

// ----- Logs -----
const logBuffer = [];
function log(kind, payload){ const ts = new Date().toISOString(); const entry = { ts, kind, ...payload }; logBuffer.push(entry); renderLogs(); }
function renderLogs(){ els.logs.textContent = logBuffer.map(e => JSON.stringify(e)).join('\n'); }
function toggleLogs(){ els.logsDrawer.classList.toggle('hidden'); }
els.btnLogs.addEventListener('click', toggleLogs);
els.btnCloseLogs.addEventListener('click', toggleLogs);
els.btnClearLogs.addEventListener('click', ()=>{ logBuffer.length=0; renderLogs(); });
els.btnCopyLogs.addEventListener('click', async ()=>{ try{ await navigator.clipboard.writeText(els.logs.textContent||''); alertBox('Logs copied','success'); }catch(e){ alertBox('Copy failed: '+e,'danger'); } });

// ----- Persistence -----
function persist(){ localStorage.setItem('agent_v8', JSON.stringify({ provider:els.provider.value, baseUrl:els.baseUrl.value, apiKey:els.apiKey.value, model:els.modelSelect.value, googleKey:els.googleKey.value, googleCx:els.googleCx.value, aipipeUrl:els.aipipeUrl.value, maxLoops:els.maxLoops.value })); }
function restore(){ try{ const s=JSON.parse(localStorage.getItem('agent_v8')||'{}'); for(const [k,v] of Object.entries(s)){ if(els[k]) els[k].value=v; } }catch{} }
restore();

// ----- Provider & Model -----
function populateModels(){
  const p = PROVIDERS[els.provider.value];
  if (!els.baseUrl.value && p.baseUrl) els.baseUrl.value = p.baseUrl;
  els.modelSelect.innerHTML='';
  p.models.forEach(m=>{ const o=document.createElement('option'); o.value=m; o.textContent=m; els.modelSelect.appendChild(o); });
  updateComputedUrl();
  persist();
}
['provider'].forEach(id=> els[id].addEventListener('change', populateModels));
['baseUrl','apiKey','modelSelect','googleKey','googleCx','aipipeUrl','maxLoops'].forEach(id => els[id].addEventListener('input', ()=>{ updateComputedUrl(); persist(); }));
populateModels();

function updateComputedUrl(){
  const base = (els.baseUrl.value||'').replace(/\/$/,'');
  const url = base ? (base + '/v1/chat/completions') : '—';
  els.computedUrl.textContent = url;
}

// ----- Detailed fetch -----
async function detailedFetch(url, options, context = {}){
  const started = Date.now();
  log('request', { url, method: options?.method||'GET', context });
  try{
    const res = await fetch(url, options);
    const dur = Date.now() - started;
    const text = await res.text().catch(()=>'');
    log('response', { url, status: res.status, statusText: res.statusText, duration_ms: dur, sample: text.slice(0, 1000), context });
    if(!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText} :: ${text.slice(0,200)}`);
    try{ return JSON.parse(text); }catch{ return text; }
  }catch(err){
    const dur = Date.now() - started;
    log('fetch_error', { url, error: String(err), duration_ms: dur, hint: 'CORS/TLS/path? See preflight & network tab.' , context });
    throw err;
  }
}

// ----- Tools -----
async function tool_google_search(args){
  const key = els.googleKey.value.trim(), cx = els.googleCx.value.trim();
  if(!key || !cx) throw new Error('Missing Google Key/CX');
  const num = Math.max(1, Math.min(10, parseInt(args.num||5,10)));
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', key); url.searchParams.set('cx', cx); url.searchParams.set('q', args.query); url.searchParams.set('num', String(num));
  const data = await detailedFetch(url.toString(), { method:'GET' }, { tool:'google_search', query: args.query, num });
  const items = (data.items||[]).map(it => ({ title: it.title, link: it.link, snippet: it.snippet }));
  return { query: args.query, results: items };
}

async function tool_aipipe_run(args){
  const endpoint = (args.endpoint || els.aipipeUrl.value).trim();
  if(!endpoint) throw new Error('Missing AiPipe Endpoint');
  const body = JSON.stringify({ flow: args.flow, payload: args.payload });
  return await detailedFetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body }, { tool:'aipipe_run', endpoint, flow: args.flow });
}

function runInWorker(code, timeoutMs = 2000){
  const workerCode = `
    let logs=[]; const origLog=console.log;
    console.log=(...a)=>{ try{ logs.push(a.map(x=>typeof x==='string'?x:JSON.stringify(x)).join(' ')); }catch{ logs.push(String(a)); } origLog(...a); };
    onmessage=async(e)=>{ const {code, timeoutMs}=e.data; try{
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction(code); const exec = fn();
      const timeout = new Promise((_,rej)=>setTimeout(()=>rej(new Error('Timeout exceeded')), timeoutMs));
      const started=Date.now(); const result = await Promise.race([exec, timeout]);
      postMessage({ ok:true, result, logs, timeMs: Date.now()-started });
    }catch(err){ postMessage({ ok:false, error:String(err), logs }); } }`;
  const blob = new Blob([workerCode], { type:'text/javascript' }); const worker = new Worker(URL.createObjectURL(blob));
  return new Promise((resolve)=>{
    const timer = setTimeout(()=>{ try{worker.terminate();}catch{} resolve({ ok:false, error:'Worker aborted (hard timeout)' }); }, Math.max(timeoutMs+250, 1500));
    worker.onmessage = (ev)=>{ clearTimeout(timer); worker.terminate(); resolve(ev.data); };
    worker.postMessage({ code:String(code||''), timeoutMs: parseInt(timeoutMs||2000,10) });
  });
}
async function tool_run_js(args){ return await runInWorker(args.code, args.timeout_ms); }

const TOOL_IMPL = { google_search: tool_google_search, aipipe_run: tool_aipipe_run, run_js: tool_run_js };

// ----- LLM call (OpenAI-compat) -----
async function chatCompletion(payload){
  const base = (els.baseUrl.value||'').replace(/\/$/,'');
  const key = els.apiKey.value.trim();
  const url = base + '/v1/chat/completions';
  const headers = { 'Content-Type':'application/json', 'Authorization': 'Bearer '+key };
  return await detailedFetch(url, { method:'POST', headers, body: JSON.stringify(payload) }, { kind:'chat', provider: els.provider.value, model: payload.model, tools: !!payload.tools });
}

// ----- Agent loop -----
async function agentLoop(){
  let loops = 0, MAX = Math.max(parseInt(els.maxLoops.value||'6',10),1);
  while(true){
    if(loops++ > MAX){ alertBox('Stopped: max loops'); break; }
    const payload = { model: els.modelSelect.value, messages, tools: toolsSpec, tool_choice: 'auto' };
    let data;
    try{ data = await chatCompletion(payload); }
    catch(err){ alertBox('LLM step failed: '+String(err), 'danger'); break; }
    const msg = (data.choices && data.choices[0] && data.choices[0].message) || {};
    if(msg.content) addMsg('agent', msg.content);
    const calls = msg.tool_calls || [];
    if(calls.length){
      for(const tc of calls){
        const name = tc.function?.name||''; let args={}; try{ args = JSON.parse(tc.function?.arguments||'{}'); }catch{}
        try{
          const impl = TOOL_IMPL[name]; if(!impl) throw new Error('Unknown tool '+name);
          const result = await impl(args);
          addTool('Tool: '+name, result);
          messages.push({ role:'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
        }catch(err){
          const fail = { ok:false, error:String(err) };
          addTool('Tool error: '+name, fail);
          alertBox(`${name} failed: `+String(err), 'danger');
          messages.push({ role:'tool', tool_call_id: tc.id, content: JSON.stringify(fail) });
        }
      }
      continue; // loop again
    } else {
      break; // wait for next user input
    }
  }
}

// ----- Input -----
async function onSend(){
  const text = els.input.value.trim();
  if(!text) return;
  els.input.value='';
  addMsg('user', text);
  messages.push({ role:'user', content:text });
  await agentLoop();
}
els.send.addEventListener('click', onSend);
els.input.addEventListener('keydown', e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); onSend(); } });

// ----- Clear -----
els.btnClear.addEventListener('click', ()=>{ messages.splice(1); els.chat.innerHTML=''; addMsg('agent','Cleared. Ready.'); });

// Seed
addMsg('agent','Ready. Provider is AiPipe by default. Fill Base URL, API key, and Model. Use tools by asking e.g. "search for IBM" or "run_js".');
