// v5 app.js — diagnostics + richer models + eye-friendly UI

// ------- Elements -------
const els = {
  chat: document.getElementById('chat'),
  input: document.getElementById('userInput'),
  send: document.getElementById('sendBtn'),
  alerts: document.getElementById('alerts'),
  provider: document.getElementById('provider'),
  baseUrl: document.getElementById('baseUrl'),
  apiKey: document.getElementById('apiKey'),
  modelSelect: document.getElementById('modelSelect'),
  model: document.getElementById('model'),
  googleKey: document.getElementById('googleKey'),
  googleCx: document.getElementById('googleCx'),
  aipipeUrl: document.getElementById('aipipeUrl'),
  maxLoops: document.getElementById('maxLoops'),
  status: document.getElementById('status'),
  toolsBadge: document.getElementById('toolsBadge'),
  clear: document.getElementById('clearBtn'),
  toggleErrors: document.getElementById('toggleErrors'),
  errorsPanel: document.getElementById('errorsPanel'),
  errors: document.getElementById('errors'),
};

// ------- Providers, paths, and model lists -------
const PROVIDERS = {
  openai:      { label:'OpenAI-compatible', baseUrl: 'https://api.openai.com',                            path: '/v1/chat/completions', tools: true  },
  openrouter:  { label:'OpenRouter (compat)', baseUrl: 'https://openrouter.ai/api',                         path: '/v1/chat/completions', tools: true  },
  perplexity:  { label:'Perplexity (compat)', baseUrl: 'https://api.perplexity.ai',                         path: '/chat/completions',    tools: false },
  gemini:      { label:'Gemini (OpenAI compat)', baseUrl: 'https://generativelanguage.googleapis.com/openai/', path: '/v1/chat/completions', tools: true  },
  aipipe:      { label:'AiPipe (OpenAI compat)', baseUrl: 'https://your-aipipe.example.com/openai',            path: '/v1/chat/completions', tools: true  },
  custom:      { label:'Custom', baseUrl: '', path: '/v1/chat/completions', tools: true  },
};

const MODELS = {
  openai: [
    'gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'o3-mini', 'o4-mini',
  ],
  openrouter: [
    'openai/gpt-4o-mini', 'anthropic/claude-3.5-sonnet', 'google/gemini-1.5-flash',
    'mistralai/mistral-small', 'meta-llama/llama-3.1-70b-instruct',
  ],
  perplexity: [
    'sonar', 'sonar-pro',
  ],
  gemini: [
    'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro-exp',
  ],
  aipipe: [
    'gpt-4o-mini', 'gpt-4o', 'llama-3.1-70b-instruct', 'mistral-large', 'mixtral-8x7b-instruct',
  ],
  custom: [
    'your-model-here'
  ]
};

// ------- Persistence -------
function persist(){ const obj={}; for(const k of ['provider','baseUrl','model','apiKey','googleKey','googleCx','aipipeUrl','maxLoops']) obj[k]=els[k]?.value||''; localStorage.setItem('agent_settings_v5', JSON.stringify(obj)); }
function restore(){ try{ const s=JSON.parse(localStorage.getItem('agent_settings_v5')||'{}'); for(const k in s){ if(els[k]) els[k].value=s[k]; } }catch(_){} }
restore();

// Populate provider + model lists
function populateProviders(){
  els.provider.innerHTML = '';
  Object.entries(PROVIDERS).forEach(([key, v]) => {
    const opt = document.createElement('option');
    opt.value = key; opt.textContent = v.label;
    if (key === 'openai') opt.selected = true;
    els.provider.appendChild(opt);
  });
}
function populateModels(){
  const p = els.provider.value;
  const list = MODELS[p] || [];
  els.modelSelect.innerHTML = '';
  list.forEach(m => {
    const opt = document.createElement('option');
    opt.value = m; opt.textContent = m;
    els.modelSelect.appendChild(opt);
  });
  // If existing text is empty, seed it with first model
  if (!els.model.value && list.length) els.model.value = list[0];
}
populateProviders(); populateModels();

function applyProviderPreset() {
  const pKey = els.provider.value;
  const p = PROVIDERS[pKey] || {};
  if (!els.baseUrl.value) els.baseUrl.value = p.baseUrl || '';
  if (!els.model.value) els.model.value = (MODELS[pKey] && MODELS[pKey][0]) || '';
  els.status.textContent = `${pKey} · ${els.model.value || 'model?'}`;
  const toolsOn = p.tools !== false;
  els.toolsBadge.textContent = toolsOn ? 'Tools: ON' : 'Tools: OFF';
  els.toolsBadge.classList.toggle('text-bg-info', toolsOn);
  els.toolsBadge.classList.toggle('text-bg-warning', !toolsOn);
  persist();
}
els.provider.addEventListener('change', () => { const p = PROVIDERS[els.provider.value] || {}; els.baseUrl.value = p.baseUrl || ''; populateModels(); if (MODELS[els.provider.value]?.length) els.model.value = MODELS[els.provider.value][0]; applyProviderPreset(); });
els.modelSelect.addEventListener('change', ()=>{ els.model.value = els.modelSelect.value; applyProviderPreset(); });
for (const k of ['baseUrl','model','apiKey','googleKey','googleCx','aipipeUrl','maxLoops']) els[k].addEventListener('input', persist);
applyProviderPreset();

// ------- UI helpers -------
function showAlert(message, variant = 'warning', timeout = 5000) {
  const id = 'al_' + Math.random().toString(36).slice(2);
  const html = `<div id="${id}" class="alert alert-${variant} alert-dismissible fade show" role="alert">
    ${message}<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button></div>`;
  els.alerts.insertAdjacentHTML('beforeend', html);
  if (timeout) setTimeout(() => { const el = document.getElementById(id); if (el) bootstrap.Alert.getOrCreateInstance(el).close(); }, timeout);
}
function escapeHtml(str){ return String(str).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;'); }
function addMsg(role, content, kind='agent'){ const card=document.createElement('div'); card.className=`card mb-2 msg ${kind}`; card.innerHTML=`<div class="card-body py-2">${escapeHtml(content)}</div>`; els.chat.appendChild(card); els.chat.scrollTop=els.chat.scrollHeight; }
function addToolMsg(title, obj){ const card=document.createElement('div'); card.className='card mb-2 msg tool'; const pretty=escapeHtml(JSON.stringify(obj,null,2)); card.innerHTML=`<div class="card-body py-2"><div class="small-muted mb-1">${title}</div><pre class="mb-0">${pretty}</pre></div>`; els.chat.appendChild(card); els.chat.scrollTop=els.chat.scrollHeight; }

// Errors drawer
let errLog = [];
function logError(entry){
  errLog.unshift(entry);
  const pre = escapeHtml(JSON.stringify(entry, null, 2));
  const card = `<div class="p-3 mb-2 err-card"><pre>${pre}</pre></div>`;
  els.errors.insertAdjacentHTML('afterbegin', card);
}
els.toggleErrors.addEventListener('click', ()=> els.errorsPanel.classList.toggle('d-none'));
document.getElementById('clearErrors').addEventListener('click', ()=>{ errLog=[]; els.errors.innerHTML=''; });

// ------- Tool schema (OpenAI-style) -------
const toolsSpec = [
  { type:'function', function:{ name:'google_search', description:'Search Google Custom Search', parameters:{ type:'object', properties:{ query:{type:'string'}, num:{type:'integer', default:5, minimum:1, maximum:10}}, required:['query'] } } },
  { type:'function', function:{ name:'aipipe_run', description:'Call AiPipe proxy', parameters:{ type:'object', properties:{ flow:{type:'string'}, payload:{type:'object'}, endpoint:{type:'string'}}, required:['flow','payload'] } } },
  { type:'function', function:{ name:'run_js', description:'Run JS in sandboxed Worker', parameters:{ type:'object', properties:{ code:{type:'string'}, timeout_ms:{type:'integer', default:2000, minimum:100}}, required:['code'] } } }
];

// ------- Diagnostics-aware fetch -------
async function detailedFetch(url, options, context = {}){
  const started = Date.now();
  try{
    const res = await fetch(url, options);
    const duration = Date.now() - started;
    const text = await res.text().catch(()=>'');
    if(!res.ok){
      const entry = {
        kind: 'http_error',
        context, url, status: res.status, statusText: res.statusText,
        duration_ms: duration,
        response_text: text.slice(0, 2000),
        hint: res.status === 0 ? 'Network blocked or CORS preflight failed' :
              res.status === 401 ? 'Auth/Key issue' :
              res.status === 404 ? 'Endpoint path mismatch' :
              res.status === 415 ? 'Content-Type not accepted (expect application/json)' :
              res.status === 429 ? 'Rate limited' : 'See response_text',
      };
      logError(entry);
      throw new Error(`HTTP ${res.status}: ${res.statusText} — ${entry.hint}\n${entry.response_text}`);
    }
    // Try to parse JSON; if fails, return raw text
    try{
      return JSON.parse(text);
    }catch(_){
      return text;
    }
  }catch(err){
    const entry = {
      kind: 'fetch_error',
      context, url,
      error: String(err),
      hint: 'Likely CORS/TLS/DNS if no status code. Ensure HTTPS and CORS headers; check DevTools → Network.',
    };
    logError(entry);
    throw err;
  }
}

// ------- Tools implementation -------
async function tool_google_search(args) {
  const key = els.googleKey.value.trim();
  const cx = els.googleCx.value.trim();
  if (!key || !cx) throw new Error('Missing Google Search API Key or CSE CX (set above).');
  const num = Math.min(Math.max(parseInt(args.num || 5, 10), 1), 10);
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', key); url.searchParams.set('cx', cx);
  url.searchParams.set('q', args.query); url.searchParams.set('num', String(num));
  return await detailedFetch(url.toString(), { method:'GET' }, { tool:'google_search', query: args.query, num });
}

async function tool_aipipe_run(args) {
  const endpoint = (args.endpoint || els.aipipeUrl.value || '').trim();
  if (!endpoint) throw new Error('Missing AiPipe endpoint URL.');
  const body = JSON.stringify({ flow: args.flow, payload: args.payload });
  return await detailedFetch(endpoint, { method:'POST', headers:{'Content-Type':'application/json'}, body }, { tool:'aipipe_run', endpoint, flow: args.flow });
}

function runInWorker(code, timeoutMs = 2000) {
  const workerCode = `
    let logs = []; const origLog = console.log;
    console.log = (...a) => { try { logs.push(a.map(x => typeof x==='string'?x:JSON.stringify(x)).join(' ')); } catch(_) { logs.push(String(a)); } origLog(...a); };
    onmessage = async (e) => { const { code, timeoutMs } = e.data;
      try { const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const fn = new AsyncFunction(code); const exec = fn();
        const timeout = new Promise((_, rej) => setTimeout(() => rej(new Error('Timeout exceeded')), timeoutMs));
        const started = Date.now(); const result = await Promise.race([exec, timeout]);
        postMessage({ ok: true, result, logs, timeMs: Date.now() - started });
      } catch (err) { postMessage({ ok: false, error: String(err), logs }); } };`;
  const blob = new Blob([workerCode], { type: 'text/javascript' }); const worker = new Worker(URL.createObjectURL(blob));
  return new Promise((resolve) => { const timer = setTimeout(() => { try { worker.terminate(); } catch(_){} resolve({ ok:false, error:'Worker aborted (hard timeout)' }); }, Math.max(timeoutMs + 250, 1500)); worker.onmessage = (ev) => { clearTimeout(timer); worker.terminate(); resolve(ev.data); }; worker.postMessage({ code, timeoutMs }); });
}
async function tool_run_js(args) { return await runInWorker(String(args.code || ''), parseInt(args.timeout_ms || 2000, 10)); }

const TOOL_DISPATCH = { google_search: tool_google_search, aipipe_run: tool_aipipe_run, run_js: tool_run_js };

// ------- Client & calls -------
function providerSupportsTools() { return (PROVIDERS[els.provider.value] || {}).tools !== false; }

function getClient(){
  const baseUrl=els.baseUrl.value.trim().replace(/\/$/,''); const key=els.apiKey.value.trim(); const model=(els.model.value || els.modelSelect.value || '').trim();
  if(!baseUrl||!key||!model) throw new Error('Please set Base URL, API Key, and Model.');
  return { baseUrl, key, model };
}

async function chatCompletion(payload){
  const { baseUrl, key }=getClient();
  const p = PROVIDERS[els.provider.value] || {};
  const path = p.path || '/v1/chat/completions';
  const url = baseUrl + path;
  const body = JSON.stringify(payload);
  return await detailedFetch(url, { method:'POST', headers:{'Content-Type':'application/json','Authorization':'Bearer '+key,'Accept':'application/json'}, body }, { kind:'chat', provider: els.provider.value, path, model: payload.model, tools: !!payload.tools });
}

async function oneLLMStep(){
  const { model }=getClient();
  const supportsTools = providerSupportsTools();
  const payload = supportsTools ? { model, messages, tools: toolsSpec, tool_choice: 'auto' } : { model, messages };
  const data = await chatCompletion(payload);
  const msg = (data.choices && data.choices[0] && data.choices[0].message) || {};
  const content = msg.content || '';
  const toolCalls = supportsTools ? (msg.tool_calls || []) : [];
  if(content) addMsg('assistant', content, 'agent');
  return toolCalls;
}

async function executeToolCalls(toolCalls){
  const jobs = toolCalls.map(async (tc) => {
    const name = tc.function?.name; let args={};
    try{ args = JSON.parse(tc.function?.arguments || '{}'); }catch(_){}
    try{
      const fn = TOOL_DISPATCH[name]; if(!fn) throw new Error('Unknown tool: ' + name);
      const result = await fn(args);
      addToolMsg(`Tool: ${name}`, result);
      messages.push({ role:'tool', tool_call_id: tc.id, content: JSON.stringify(result) });
    }catch(err){
      const fail = { ok:false, error: String(err) };
      showAlert(`${name} failed: ${String(err)}`, 'danger'); addToolMsg(`Tool error: ${name}`, fail);
      messages.push({ role:'tool', tool_call_id: tc.id, content: JSON.stringify(fail) });
    }
  });
  await Promise.all(jobs);
}

// ------- Conversation state -------
const messages = [ { role:'system', content:'You are a colorful browser LLM agent with google_search, aipipe_run, and run_js tools. Decide when to use them. Keep responses concise and mention the tool when helpful.' } ];

async function agentLoop(){
  let loops=0; const MAX=Math.max(parseInt(els.maxLoops.value||'6',10),1);
  while(true){
    if(loops++>MAX){ showAlert('Stopped: reached max tool loops'); break; }
    let toolCalls=[];
    try{ toolCalls = await oneLLMStep(); } catch(err){ showAlert('LLM step failed: ' + String(err), 'danger', 8000); break; }
    if(toolCalls && toolCalls.length){ await executeToolCalls(toolCalls); continue; }
    else break;
  }
}

// ------- Input handlers -------
async function onSend(){ const text=els.input.value.trim(); if(!text) return; els.input.value=''; addMsg('user',text,'user'); messages.push({role:'user',content:text}); await agentLoop(); }
els.send.addEventListener('click', onSend);
els.input.addEventListener('keydown', (e) => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); onSend(); }});
els.clear.addEventListener('click', () => { messages.splice(1); els.chat.innerHTML = '<div class="small-muted mb-2">💡 Tip: ask it to <span class="kbd">search</span>, <span class="kbd">run_js</span>, or call <span class="kbd">aipipe_run</span>.</div>'; addMsg('assistant','Cleared. Ready.','agent'); });

// ------- Seed message -------
addMsg('assistant','Ready. Settings above auto-fit. Errors tab shows full diagnostics (status, path, response). Choose a provider, pick a model from the list, or type your own.','agent');
