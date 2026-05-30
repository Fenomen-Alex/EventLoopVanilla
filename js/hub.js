// Event Loop Hub - Live Architecture Visualization

const HUB_EXAMPLES = {
  basic: {
    code: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');`,
    steps: [
      { stack: ['global'], micro: [], macro: [], output: [], highlight: 1, desc: 'Global execution context created' },
      { stack: ['global','console.log'], micro: [], macro: [], output: ['1'], highlight: 1, desc: 'console.log("1") executes synchronously' },
      { stack: ['global'], micro: [], macro: ['setTimeout cb'], output: ['1'], highlight: 2, desc: 'setTimeout schedules a macrotask (callback)' },
      { stack: ['global'], micro: ['Promise.then'], macro: ['setTimeout cb'], output: ['1'], highlight: 3, desc: 'Promise.resolve().then schedules a microtask' },
      { stack: ['global','console.log'], micro: ['Promise.then'], macro: ['setTimeout cb'], output: ['1','4'], highlight: 4, desc: 'console.log("4") executes synchronously' },
      { stack: ['global'], micro: ['Promise.then'], macro: ['setTimeout cb'], output: ['1','4'], highlight: 0, desc: 'Call stack empty — microtasks are processed' },
      { stack: ['Promise.then cb'], micro: [], macro: ['setTimeout cb'], output: ['1','4'], highlight: 0, desc: 'Microtask (Promise.then) moves to call stack' },
      { stack: [], micro: [], macro: ['setTimeout cb'], output: ['1','4','3'], highlight: 0, desc: 'Promise callback logs "3"' },
      { stack: ['setTimeout cb'], micro: [], macro: [], output: ['1','4','3'], highlight: 0, desc: 'Macrotask (setTimeout cb) moves to call stack' },
      { stack: [], micro: [], macro: [], output: ['1','4','3','2'], highlight: 0, desc: 'setTimeout callback logs "2"' },
    ]
  },
  nesting: {
    code: `setTimeout(() => {
  console.log('timeout');
  Promise.resolve().then(() => console.log('promise'));
}, 0);
setTimeout(() => console.log('timeout2'), 0);`,
    steps: [
      { stack: ['global'], micro: [], macro: [], output: [], highlight: 1, desc: 'Global execution context' },
      { stack: ['global'], micro: [], macro: ['setTimeout-1'], output: [], highlight: 5, desc: 'First setTimeout scheduled (macrotask)' },
      { stack: ['global'], micro: [], macro: ['setTimeout-1','setTimeout-2'], output: [], highlight: 6, desc: 'Second setTimeout scheduled (macrotask)' },
      { stack: ['setTimeout-1 cb'], micro: [], macro: ['setTimeout-2'], output: [], highlight: 2, desc: 'Macrotask #1: setTimeout callback enters call stack' },
      { stack: ['setTimeout-1 cb'], micro: [], macro: ['setTimeout-2'], output: ['timeout'], highlight: 2, desc: 'console.log("timeout")' },
      { stack: [], micro: ['Promise.then'], macro: ['setTimeout-2'], output: ['timeout'], highlight: 0, desc: 'Promise.then scheduled inside timeout — becomes a microtask' },
      { stack: ['Promise.then cb'], micro: [], macro: ['setTimeout-2'], output: ['timeout'], highlight: 0, desc: 'Microtask queue drained — Promise callback runs' },
      { stack: [], micro: [], macro: ['setTimeout-2'], output: ['timeout','promise'], highlight: 0, desc: 'Promise callback logs "promise"' },
      { stack: ['setTimeout-2 cb'], micro: [], macro: [], output: ['timeout','promise'], highlight: 0, desc: 'Macrotask #2 runs' },
      { stack: [], micro: [], macro: [], output: ['timeout','promise','timeout2'], highlight: 0, desc: 'Done — "timeout2" logged' },
    ]
  },
  micro_macro: {
    code: `console.log('start');
setTimeout(() => console.log('macro'), 0);
Promise.resolve().then(() => console.log('micro'));
queueMicrotask(() => console.log('micro2'));
console.log('end');`,
    steps: [
      { stack: ['global'], micro: [], macro: [], output: [], highlight: 1, desc: 'Global context created' },
      { stack: ['global'], micro: [], macro: [], output: ['start'], highlight: 1, desc: 'Logs "start"' },
      { stack: ['global'], micro: [], macro: ['setTimeout'], output: ['start'], highlight: 2, desc: 'setTimeout → macrotask' },
      { stack: ['global'], micro: ['Promise.then'], macro: ['setTimeout'], output: ['start'], highlight: 3, desc: 'Promise → microtask' },
      { stack: ['global'], micro: ['Promise.then','queueMicrotask'], macro: ['setTimeout'], output: ['start'], highlight: 4, desc: 'queueMicrotask → microtask' },
      { stack: ['global'], micro: ['Promise.then','queueMicrotask'], macro: ['setTimeout'], output: ['start','end'], highlight: 5, desc: 'Logs "end"' },
      { stack: [], micro: ['Promise.then','queueMicrotask'], macro: ['setTimeout'], output: ['start','end'], highlight: 0, desc: 'Stack empty → process microtasks' },
      { stack: ['Promise.then'], micro: ['queueMicrotask'], macro: ['setTimeout'], output: ['start','end','micro'], highlight: 0, desc: 'Promise.then runs (FIFO)' },
      { stack: ['queueMicrotask'], micro: [], macro: ['setTimeout'], output: ['start','end','micro','micro2'], highlight: 0, desc: 'queueMicrotask runs' },
      { stack: ['setTimeout cb'], micro: [], macro: [], output: ['start','end','micro','micro2'], highlight: 0, desc: 'Macrotask (setTimeout) finally runs' },
      { stack: [], micro: [], macro: [], output: ['start','end','micro','micro2','macro'], highlight: 0, desc: 'Done — order: sync → microtasks → macrotasks' },
    ]
  }
};

let hubExampleId = 'basic';
let hubStep = 0;
let hubTimer = null;

const HUB_HTML = `
<div class="max-w-[1400px] mx-auto">
  <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
    <div>
      <h2 class="text-[28px] font-bold text-[#dee3e8]">Event Loop Hub</h2>
      <p class="text-[14px] text-[#bdc8d1] mt-1 max-w-xl">Step-by-step visualization of the call stack, callback queue, microtask queue, and event loop cycle.</p>
    </div>
    <div class="glass-panel px-4 py-2 flex items-center gap-4 border-l-4 border-l-[#ffed76]">
      <div class="flex items-center gap-2">
        <div class="w-2 h-2 rounded-full bg-[#ffed76]" id="hub-status-dot"></div>
        <span class="text-[12px] font-mono text-[#ffed76]" id="hub-status-text">Engine: Idle</span>
      </div>
      <div class="w-px h-4 bg-[#3e484f]"></div>
      <div class="flex items-center gap-2">
        <span class="text-[16px] text-[#e1bfff]">⚡</span>
        <span class="text-[12px] font-mono text-[#e1bfff]">Microtasks: <span id="hub-micro-count">0</span></span>
      </div>
    </div>
  </div>

  <div class="mb-4 flex flex-wrap gap-2">
    <button class="tab-btn active" data-example="basic">console.log + setTimeout + Promise</button>
    <button class="tab-btn" data-example="nesting">Nested setTimeout + Promise</button>
    <button class="tab-btn" data-example="micro_macro">Microtask vs Macrotask</button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">
    <div class="lg:col-span-4 glass-panel border-l-4 border-l-[#ffed76] glow-secondary">
      <div class="px-4 py-3 border-b border-[rgba(62,72,79,0.3)] flex items-center justify-between">
        <h3 class="text-[12px] font-mono font-bold text-[#ffed76] uppercase tracking-wider flex items-center gap-2">
          <span class="text-[16px]">🧠</span> JS Engine
        </h3>
        <span class="text-[10px] text-[#bdc8d1] font-mono px-2 py-0.5 rounded bg-[#343a3e]">V8</span>
      </div>
      <div class="p-4">
        <div class="bg-[#0a0f12] border border-[rgba(62,72,79,0.5)] rounded-lg p-3 relative min-h-[180px]">
          <div class="absolute top-0 right-0 bg-[#343a3e] px-2 py-0.5 rounded-bl-lg text-[10px] text-[#bdc8d1] font-mono">Call Stack</div>
          <div id="hub-stack" class="mt-6 flex flex-col-reverse gap-1 min-h-[120px]">
            <div class="bg-[#303539] px-3 py-2 rounded text-[12px] font-mono text-[#bdc8d1] border border-[rgba(62,72,79,0.3)]">global</div>
          </div>
        </div>
        <div class="bg-[#0a0f12] border border-[rgba(62,72,79,0.5)] rounded-lg p-3 relative mt-3 h-16">
          <div class="absolute top-0 right-0 bg-[#343a3e] px-2 py-0.5 rounded-bl-lg text-[10px] text-[#bdc8d1] font-mono">Memory Heap</div>
          <div class="mt-5 flex items-end gap-1 h-6">
            <div class="w-1/6 bg-[#ffed76]/30 h-1/4 rounded-t"></div>
            <div class="w-1/6 bg-[#ffed76]/50 h-3/4 rounded-t"></div>
            <div class="w-1/6 bg-[#ffed76]/40 h-1/2 rounded-t"></div>
            <div class="w-1/6 bg-[#ffed76]/20 h-1/5 rounded-t"></div>
          </div>
        </div>
      </div>
    </div>

    <div class="lg:col-span-4 flex items-center justify-center">
      <div class="relative w-48 h-48 rounded-full border-4 border-dashed border-[rgba(142,213,255,0.3)] flex items-center justify-center bg-[rgba(10,15,18,0.5)] backdrop-blur-md" id="hub-event-loop">
        <div class="w-32 h-32 rounded-full bg-[#1b2024] flex flex-col items-center justify-center border border-[rgba(142,213,255,0.5)]">
          <span class="text-[28px] text-[#8ed5ff]" id="hub-spinner">⟳</span>
          <span class="text-[16px] font-bold text-[#dee3e8] text-center leading-tight">Event<br/>Loop</span>
        </div>
        <div class="absolute -top-1 w-3 h-3 rounded-full bg-[#8ed5ff]" id="hub-orbit-dot"></div>
      </div>
    </div>

    <div class="lg:col-span-4 glass-panel border-l-4 border-l-[#e1bfff] glow-tertiary">
      <div class="px-4 py-3 border-b border-[rgba(62,72,79,0.3)] flex items-center justify-between">
        <h3 class="text-[12px] font-mono font-bold text-[#e1bfff] uppercase tracking-wider flex items-center gap-2">
          <span class="text-[16px]">⚡</span> Microtasks
        </h3>
        <span class="text-[10px] text-[#bdc8d1] font-mono px-2 py-0.5 rounded bg-[#343a3e]">High Priority</span>
      </div>
      <div class="p-4">
        <div id="hub-micro" class="flex gap-2 overflow-x-auto min-h-[60px] pb-2"></div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
    <div class="lg:col-span-6 glass-panel border-l-4 border-l-[#7bd0ff]">
      <div class="px-4 py-3 border-b border-[rgba(62,72,79,0.3)] flex items-center justify-between">
        <h3 class="text-[12px] font-mono font-bold text-[#7bd0ff] uppercase tracking-wider flex items-center gap-2">
          <span class="text-[16px]">📋</span> Macro Tasks
        </h3>
        <span class="text-[10px] text-[#bdc8d1] font-mono px-2 py-0.5 rounded bg-[#343a3e]">Standard</span>
      </div>
      <div class="p-4">
        <div id="hub-macro" class="flex gap-2 overflow-x-auto min-h-[60px] pb-2"></div>
      </div>
    </div>

    <div class="lg:col-span-6 glass-panel">
      <div class="px-4 py-3 border-b border-[rgba(62,72,79,0.3)] flex items-center justify-between">
        <h3 class="text-[12px] font-mono font-bold text-[#dee3e8] uppercase tracking-wider flex items-center gap-2">
          <span class="text-[16px]">💻</span> Console Output
        </h3>
        <button onclick="hubReset()" class="text-[10px] text-[#bdc8d1] hover:text-[#dee3e8] font-mono tracking-wider uppercase transition-colors">Clear</button>
      </div>
      <div class="p-4">
        <div id="hub-console" class="bg-black border border-[rgba(62,72,79,0.3)] rounded-lg p-3 font-mono text-[13px] min-h-[80px] max-h-[160px] overflow-y-auto"></div>
      </div>
    </div>
  </div>

  <div class="mt-6 flex items-center gap-3 justify-center">
    <button onclick="hubReset()" class="px-4 py-2 rounded-lg text-[#bdc8d1] hover:text-[#dee3e8] hover:bg-[rgba(48,53,57,0.3)] transition-colors flex items-center gap-2 text-[13px]">
      <span class="text-[18px]">↺</span> Reset
    </button>
    <button onclick="hubPrev()" class="px-4 py-2 rounded-lg bg-[rgba(56,189,248,0.1)] border border-[rgba(142,213,255,0.3)] text-[#8ed5ff] hover:bg-[rgba(56,189,248,0.2)] transition-all flex items-center gap-2 text-[13px]" id="hub-prev-btn">
      <span class="text-[18px]">◀</span> Prev
    </button>
    <button onclick="hubStepForward()" class="px-5 py-2 rounded-lg bg-[rgba(56,189,248,0.15)] border border-[rgba(142,213,255,0.5)] text-[#8ed5ff] hover:bg-[rgba(56,189,248,0.25)] transition-all flex items-center gap-2 text-[13px] font-semibold shadow-[0_0_15px_rgba(56,189,248,0.15)]" id="hub-step-btn">
      <span class="text-[18px]">▶</span> Step Forward
    </button>
    <button onclick="hubAutoPlay()" class="px-4 py-2 rounded-lg bg-[#343a3e] border border-[rgba(62,72,79,0.5)] text-[#dee3e8] hover:bg-[#3e484f] transition-all flex items-center gap-2 text-[13px]" id="hub-auto-btn">
      <span class="text-[18px]">⏩</span> Auto
    </button>
  </div>

  <div class="mt-4 text-center">
    <p class="text-[13px] text-[#bdc8d1] font-mono" id="hub-desc">Select an example and step through the event loop.</p>
    <p class="text-[11px] text-[#3e484f] mt-1" id="hub-step-info">Step 0 / 0</p>
  </div>
</div>
`;

function hubRenderQueue(containerId, items, color) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = items.length === 0
    ? '<div class="text-[11px] text-[#3e484f] font-mono flex items-center justify-center w-full h-full min-h-[40px]">— empty —</div>'
    : items.map((item, i) =>
        `<div class="queue-item shrink-0 px-3 py-2 rounded-lg font-mono text-[11px]" style="border:1px solid ${color}40;background:${color}10;color:${color}">
          ${i === 0 ? '▶ ' : ''}${item}
         </div>`
      ).join('');
}

function hubRenderStack(frames) {
  const el = document.getElementById('hub-stack');
  if (!el) return;
  el.innerHTML = frames.length === 0
    ? '<div class="text-[11px] text-[#3e484f] font-mono py-2">— empty —</div>'
    : [...frames].reverse().map((f, i) =>
        `<div class="stack-frame px-3 py-2 rounded text-[12px] font-mono border" style="${i === 0 ? 'background:rgba(56,189,248,0.15);border-color:rgba(142,213,255,0.5);color:#8ed5ff' : 'background:rgba(48,53,57,0.3);border-color:rgba(62,72,79,0.3);color:#bdc8d1'}">
          ${f}
         </div>`
      ).join('');
}

function hubRenderConsole(lines) {
  const el = document.getElementById('hub-console');
  if (!el) return;
  el.innerHTML = lines.length === 0
    ? '<div class="text-[11px] text-[#3e484f] font-mono py-2">— output —</div>'
    : lines.map(l => `<div class="console-line flex items-start gap-2"><span class="text-[#3e484f] text-[10px] mt-0.5">❯</span><span>${l}</span></div>`).join('');
  el.scrollTop = el.scrollHeight;
}

function hubUpdate(ex) {
  const data = HUB_EXAMPLES[ex || hubExampleId];
  const step = data.steps[hubStep] || data.steps[0];
  hubRenderStack(step.stack);
  hubRenderQueue('hub-micro', step.micro, '#e1bfff');
  hubRenderQueue('hub-macro', step.macro, '#7bd0ff');
  hubRenderConsole(step.output);

  const dot = document.getElementById('hub-status-dot');
  const text = document.getElementById('hub-status-text');
  if (step.stack.length > 1) {
    dot.style.background = '#8ed5ff';
    dot.style.boxShadow = '0 0 8px rgba(142,213,255,0.8)';
    text.textContent = 'Engine: Executing';
    text.style.color = '#8ed5ff';
  } else {
    dot.style.background = '#ffed76';
    dot.style.boxShadow = '0 0 8px rgba(255,237,118,0.8)';
    text.textContent = 'Engine: Idle';
    text.style.color = '#ffed76';
  }

  const spinner = document.getElementById('hub-spinner');
  if (spinner) spinner.style.animation = step.stack.length > 1 ? 'spin 1s linear infinite' : 'none';

  document.getElementById('hub-micro-count').textContent = step.micro.length;
  document.getElementById('hub-desc').textContent = step.desc || '';

  const total = data.steps.length;
  document.getElementById('hub-step-info').textContent = `Step ${Math.min(hubStep + 1, total)} / ${total}`;

  document.getElementById('hub-prev-btn').disabled = hubStep <= 0;
  document.getElementById('hub-prev-btn').style.opacity = hubStep <= 0 ? '0.4' : '1';
  document.getElementById('hub-step-btn').disabled = hubStep >= total - 1;
  document.getElementById('hub-step-btn').style.opacity = hubStep >= total - 1 ? '0.4' : '1';
}

function hubStepForward() {
  const data = HUB_EXAMPLES[hubExampleId];
  if (hubStep < data.steps.length - 1) { hubStep++; hubUpdate(); }
}

function hubPrev() {
  if (hubStep > 0) { hubStep--; hubUpdate(); }
}

function hubReset() {
  hubStep = 0;
  if (hubTimer) { clearInterval(hubTimer); hubTimer = null; }
  document.getElementById('hub-auto-btn').innerHTML = '<span class="text-[18px]">⏩</span> Auto';
  hubUpdate();
}

function hubAutoPlay() {
  if (hubTimer) {
    clearInterval(hubTimer); hubTimer = null;
    document.getElementById('hub-auto-btn').innerHTML = '<span class="text-[18px]">⏩</span> Auto';
    return;
  }
  const data = HUB_EXAMPLES[hubExampleId];
  if (hubStep >= data.steps.length - 1) hubStep = 0;
  document.getElementById('hub-auto-btn').innerHTML = '<span class="text-[18px]">⏸</span> Pause';
  hubTimer = setInterval(() => {
    const d = HUB_EXAMPLES[hubExampleId];
    if (hubStep >= d.steps.length - 1) { hubAutoPlay(); return; }
    hubStep++; hubUpdate();
  }, 600);
}

function render_hub() {
  const container = document.getElementById('page-hub');
  if (container.dataset.loaded) return;
  container.innerHTML = HUB_HTML;
  container.dataset.loaded = '1';

  document.querySelectorAll('#page-hub [data-example]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#page-hub [data-example]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      hubExampleId = btn.dataset.example;
      hubReset();
      hubUpdate();
    });
  });

  hubUpdate();
}
