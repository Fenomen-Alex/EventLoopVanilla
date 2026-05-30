// Interactive Execution Playground - Live Event Loop Stepper

const PG_EXAMPLES = {
  basic: {
    name: 'Sync + setTimeout + Promise',
    code: `console.log('1');
setTimeout(() => console.log('2'), 0);
Promise.resolve().then(() => console.log('3'));
console.log('4');`,
    desc: 'Classic demo: sync code runs first, then microtasks (Promise), then macrotasks (setTimeout).'
  },
  micro_macro: {
    name: 'Microtask vs Macrotask Order',
    code: `console.log('start');
setTimeout(() => console.log('timeout'), 0);
Promise.resolve().then(() => console.log('promise'));
queueMicrotask(() => console.log('microtask'));
console.log('end');`,
    desc: 'Microtasks (Promise.then, queueMicrotask) always execute BEFORE macrotasks (setTimeout).'
  },
  nested: {
    name: 'Nested Timeouts & Promises',
    code: `setTimeout(() => {
  console.log('outer timeout');
  Promise.resolve().then(() => console.log('inner promise'));
}, 0);
setTimeout(() => console.log('second timeout'), 0);`,
    desc: 'Microtasks scheduled inside a macrotask are drained before the next macrotask.'
  },
  nexttick: {
    name: 'process.nextTick (Microtask)',
    code: `console.log('1');
// nextTick-like behavior via queueMicrotask
queueMicrotask(() => console.log('nextTick'));
Promise.resolve().then(() => console.log('promise'));
console.log('2');`,
    desc: 'process.nextTick and Promise callbacks are both microtasks. nextTick runs first in Node.js.'
  },
  async_await: {
    name: 'async/await Microtasks',
    code: `async function foo() {
  console.log('A');
  await bar();
  console.log('C');
}
function bar() {
  console.log('B');
  return Promise.resolve();
}
foo();
console.log('D');`,
    desc: 'await pauses execution and schedules the rest as a microtask.'
  },
  event_lifecycle: {
    name: 'Event Loop Lifecycle',
    code: `console.log('1: sync');

setTimeout(() => console.log('2: macrotask'), 0);

Promise.resolve()
  .then(() => console.log('3: microtask 1'))
  .then(() => console.log('4: microtask 2'));

queueMicrotask(() => console.log('5: microtask 3'));

console.log('6: sync end');`,
    desc: 'Full lifecycle: sync → drain microtasks (including chained) → one macrotask → repeat.'
  }
};

// Execution engine: instruments code with observable event loop
class EventLoopSimulator {
  constructor() {
    this.reset();
  }

  reset() {
    this.plan = [];
  }

  _realPlan(lines) {
    this.plan = [];
    // Step 1: Collect all events in order
    const syncOps = [];
    const timerOps = [];
    const promiseOps = [];
    let hasAsync = false;
    let inCallbackBody = false;
    let callbackBraceDepth = 0;

    lines.forEach((line, i) => {
      const t = line.trim();
      if (!t || t.startsWith('//')) return;

      // ---- Track multi-line callback bodies ----
      const openCnt = (t.match(/{/g) || []).length;
      const closeCnt = (t.match(/}/g) || []).length;
      const isSchedulingLine = t.includes('setTimeout(') || t.includes('setTimeout (') ||
                               t.includes('.then(') || t.includes('.then (') ||
                               t.includes('queueMicrotask(');

      if (!inCallbackBody && isSchedulingLine && openCnt > 0) {
        inCallbackBody = true;
        callbackBraceDepth = openCnt - closeCnt;
      } else if (inCallbackBody) {
        callbackBraceDepth += openCnt - closeCnt;
        if (callbackBraceDepth <= 0) {
          inCallbackBody = false;
          callbackBraceDepth = 0;
        }
      }

      if (t.includes('console.log') && !inCallbackBody && !t.includes('setTimeout') && !t.includes('Promise.resolve()') && !t.includes('queueMicrotask(') && !t.includes('.then(')) {
        const match = t.match(/console\.log\(['"](.+?)['"]\)/);
        syncOps.push({ type: 'log', value: match ? match[1] : '...', line: i, desc: `Log "${match ? match[1] : '...'}"` });
      }
      if (t.includes('setTimeout(') || t.includes('setTimeout (')) {
        const val = t.includes('console.log') ? (t.match(/['"](.+?)['"]/) || ['','cb'])[1] : 'cb';
        timerOps.push({ type: 'schedule-macro', value: val, line: i, desc: `setTimeout → macrotask ("${val}")` });
      }
      if (t.includes('Promise.resolve()')) {
        if (t.includes('.then(') || t.includes('.then (')) {
          const val = t.includes('console.log') ? (t.match(/['"](.+?)['"]/) || ['','then'])[1] : 'then';
          promiseOps.push({ type: 'schedule-micro', value: val, line: i, desc: `Promise.then → microtask ("${val}")` });
        } else {
          promiseOps.push({ type: 'schedule-micro', value: 'resolve', line: i, desc: `Promise.resolve()` });
        }
      }
      if (t.includes('queueMicrotask(')) {
        const val = t.includes('console.log') ? (t.match(/['"](.+?)['"]/) || ['','qm'])[1] : 'qm';
        promiseOps.push({ type: 'schedule-micro', value: val, line: i, desc: `queueMicrotask → microtask ("${val}")` });
      }
      if (t.includes('await ')) {
        hasAsync = true;
        syncOps.push({ type: 'await-pause', value: 'await', line: i, desc: `await — yield to microtask queue` });
      }
      if (t.includes('async function')) {
        syncOps.push({ type: 'enter-async', value: 'async fn', line: i, desc: `Async function created` });
      }
    });

    // Combine them in proper event loop order:
    // 1. Sync operations (in order)
    // 2. After stack empties: drain microtasks (all of them, in order)
    // 3. Then one macrotask (repeat)

    // Push sync ops
    syncOps.forEach(op => this.plan.push(op));

    // Mark stack empty
    this.plan.push({ type: 'stack-empty', value: '', line: -1, desc: 'Call stack empty — check queues' });

    // All scheduled microtasks execute before macrotasks
    if (promiseOps.length > 0) {
      promiseOps.forEach(op => this.plan.push({ type: 'execute-micro', value: op.value, line: op.line, desc: `Execute microtask → log "${op.value}"` }));
    }

    // Then macrotasks
    this.plan.push({ type: 'stack-empty', value: '', line: -1, desc: 'Microtasks drained — process one macrotask' });

    if (timerOps.length > 0) {
      timerOps.forEach(op => this.plan.push({ type: 'execute-macro', value: op.value, line: op.line, desc: `Execute macrotask → log "${op.value}"` }));
    }

    this.plan.push({ type: 'done', value: '', line: -1, desc: 'Execution complete' });

    // Handle async/await specially
    if (hasAsync) {
      // Insert microtask after await pause
      const idx = this.plan.findIndex(p => p.type === 'await-pause');
      if (idx >= 0) {
        this.plan.splice(idx + 1, 0, { type: 'execute-micro', value: 'after await', line: -1, desc: 'Resume after await (microtask)' });
      }
    }
  }

  getStep(i) {
    if (i < 0 || i >= this.plan.length) return null;
    return this.plan[i];
  }

  getState(stepIdx) {
    if (!this.plan || this.plan.length === 0) return null;

    const state = {
      stack: [],
      micro: [],
      macro: [],
      output: [],
      highlight: -1,
      desc: ''
    };

    for (let i = 0; i <= stepIdx && i < this.plan.length; i++) {
      const op = this.plan[i];

      if (op.type === 'log') {
        state.stack = ['<global>', `console.log`];
        if (!state.output.includes(op.value)) state.output.push(op.value);
        state.highlight = op.line;
      }

      if (op.type === 'schedule-macro') {
        state.stack = ['<global>'];
        state.macro.push(`setTimeout: "${op.value}"`);
        state.highlight = op.line;
      }

      if (op.type === 'schedule-micro') {
        state.stack = ['<global>'];
        state.micro.push(`Promise: "${op.value}"`);
        state.highlight = op.line;
      }

      if (op.type === 'stack-empty') {
        state.stack = [];
      }

      if (op.type === 'execute-micro') {
        state.stack = ['[microtask]'];
        state.micro = state.micro.slice(1);
        if (!state.output.includes(op.value)) state.output.push(op.value);
      }

      if (op.type === 'execute-macro') {
        state.stack = ['[macrotask]'];
        state.macro = state.macro.slice(1);
        if (!state.output.includes(op.value)) state.output.push(op.value);
      }

      if (op.type === 'await-pause') {
        state.stack = [];
        state.micro.push('[await continuation]');
      }

      if (op.type === 'done') {
        state.stack = [];
        state.micro = [];
        state.macro = [];
      }

      state.desc = op.desc;
    }

    return state;
  }
}

const pgSim = new EventLoopSimulator();
let pgStep = 0;
let pgExampleId = 'basic';
let pgTimer = null;

const PG_HTML = `
<div class="max-w-[1400px] mx-auto">
  <div class="flex items-center justify-between mb-6 flex-wrap gap-4">
    <div>
      <h2 class="text-[28px] font-bold text-[#dee3e8]">Interactive Playground</h2>
      <p class="text-[14px] text-[#bdc8d1] mt-1 max-w-2xl">Write or select JavaScript code and step through the event loop. Watch the call stack, queues, and console update in real time.</p>
    </div>
  </div>

  <div class="mb-4 flex flex-wrap gap-2">
    <button class="tab-btn active" data-pg-example="basic">Basic</button>
    <button class="tab-btn" data-pg-example="micro_macro">Micro vs Macro</button>
    <button class="tab-btn" data-pg-example="nested">Nested</button>
    <button class="tab-btn" data-pg-example="nexttick">nextTick</button>
    <button class="tab-btn" data-pg-example="async_await">async/await</button>
    <button class="tab-btn" data-pg-example="event_lifecycle">Lifecycle</button>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-4">
    <div class="lg:col-span-5 glass-panel overflow-hidden">
      <div class="bg-[rgba(37,43,46,0.8)] px-4 py-2 border-b border-[rgba(62,72,79,0.3)] flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-[14px] text-[#bdc8d1]">&lt;/&gt;</span>
          <span class="text-[12px] font-mono text-[#bdc8d1]">example.js</span>
        </div>
        <div class="flex gap-1.5">
          <div class="w-2.5 h-2.5 rounded-full bg-[#93000a] border border-[rgba(255,180,171,0.2)]"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-[rgba(231,208,0,0.5)] border border-[rgba(255,237,118,0.2)]"></div>
          <div class="w-2.5 h-2.5 rounded-full bg-[rgba(56,189,248,0.5)] border border-[rgba(142,213,255,0.2)]"></div>
        </div>
      </div>
      <div class="relative">
        <textarea id="pg-editor" class="w-full h-[400px] bg-[#0a0f12] text-[13px] font-mono text-[#dee3e8] p-4 border-0 outline-none resize-none leading-relaxed" spellcheck="false"></textarea>
        <div id="pg-line-marker" class="absolute left-0 top-0 w-0.5 bg-[#8ed5ff] transition-all duration-200 pointer-events-none" style="height:20px;opacity:0;box-shadow:0 0 8px rgba(142,213,255,0.8)"></div>
      </div>
      <div class="px-4 py-2 bg-[rgba(10,15,18,0.5)] border-t border-[rgba(62,72,79,0.3)]">
        <p class="text-[11px] text-[#bdc8d1] font-mono" id="pg-desc">Select an example or write your own code.</p>
      </div>
    </div>

    <div class="lg:col-span-7 flex flex-col gap-4">
      <div class="grid grid-cols-2 gap-4">
        <div class="glass-panel p-4">
          <h3 class="text-[11px] font-mono font-bold text-[#ffed76] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="text-[14px]">⚡</span> Microtask Queue
          </h3>
          <div id="pg-micro" class="flex flex-col gap-1.5 min-h-[60px]"></div>
        </div>
        <div class="glass-panel p-4">
          <h3 class="text-[11px] font-mono font-bold text-[#7bd0ff] uppercase tracking-wider mb-3 flex items-center gap-2">
            <span class="text-[14px]">📋</span> Macrotask Queue
          </h3>
          <div id="pg-macro" class="flex flex-col gap-1.5 min-h-[60px]"></div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="glass-panel p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-[11px] font-mono font-bold text-[#8ed5ff] uppercase tracking-wider flex items-center gap-2">
              <span class="text-[14px]">📚</span> Call Stack
            </h3>
            <span class="text-[9px] font-mono text-[#bdc8d1] bg-[rgba(52,58,62,0.5)] px-1.5 py-0.5 rounded">LIFO</span>
          </div>
          <div id="pg-stack" class="flex flex-col-reverse gap-1 min-h-[80px]"></div>
        </div>
        <div class="glass-panel overflow-hidden">
          <div class="bg-black px-4 py-2 border-b border-[rgba(62,72,79,0.3)] flex items-center justify-between">
            <span class="text-[11px] font-mono text-[#bdc8d1] uppercase tracking-wider flex items-center gap-2">
              <span class="text-[12px]">❯</span> Output
            </span>
            <button onclick="pgClearOutput()" class="text-[9px] text-[#bdc8d1] hover:text-[#dee3e8] uppercase tracking-wider">Clear</button>
          </div>
          <div id="pg-console" class="p-4 font-mono text-[13px] min-h-[100px] max-h-[200px] overflow-y-auto bg-black"></div>
        </div>
      </div>
    </div>
  </div>

  <div class="mt-6 flex items-center gap-3 justify-center flex-wrap">
    <button onclick="pgReset()" class="px-4 py-2 rounded-lg text-[#bdc8d1] hover:text-[#dee3e8] hover:bg-[rgba(48,53,57,0.3)] transition-colors flex items-center gap-2 text-[13px]">
      <span class="text-[18px]">↺</span> Reset
    </button>
    <button onclick="pgPrev()" class="px-4 py-2 rounded-lg bg-[rgba(56,189,248,0.1)] border border-[rgba(142,213,255,0.3)] text-[#8ed5ff] hover:bg-[rgba(56,189,248,0.2)] transition-all flex items-center gap-2 text-[13px]" id="pg-prev-btn">
      <span class="text-[18px]">◀</span> Prev
    </button>
    <button onclick="pgStepForward()" class="px-5 py-2 rounded-lg bg-[rgba(56,189,248,0.15)] border border-[rgba(142,213,255,0.5)] text-[#8ed5ff] hover:bg-[rgba(56,189,248,0.25)] transition-all flex items-center gap-2 text-[13px] font-semibold shadow-[0_0_15px_rgba(56,189,248,0.15)]" id="pg-step-btn">
      <span class="text-[18px]">▶</span> Step Forward
    </button>
    <button onclick="pgAuto()" class="px-4 py-2 rounded-lg bg-[#343a3e] border border-[rgba(62,72,79,0.5)] text-[#dee3e8] hover:bg-[#3e484f] transition-all flex items-center gap-2 text-[13px]" id="pg-auto-btn">
      <span class="text-[18px]">⏩</span> Run All
    </button>
    <button onclick="pgRunCustom()" class="px-4 py-2 rounded-lg bg-[rgba(225,191,255,0.1)] border border-[rgba(225,191,255,0.3)] text-[#e1bfff] hover:bg-[rgba(225,191,255,0.2)] transition-all flex items-center gap-2 text-[13px]" id="pg-run-btn">
      <span class="text-[18px]">▶</span> Run Custom
    </button>
  </div>

  <div class="mt-4 text-center">
    <p class="text-[12px] text-[#bdc8d1] font-mono" id="pg-status">Ready. Click "Step Forward" or "Run All".</p>
  </div>
</div>
`;

function pgUpdate() {
  pgSim._realPlan(document.getElementById('pg-editor').value.split('\n'));
  const state = pgSim.getState(pgStep);
  if (!state) return;

  // Stack
  const stackEl = document.getElementById('pg-stack');
  stackEl.innerHTML = state.stack.length === 0
    ? '<div class="text-[11px] text-[#3e484f] font-mono py-2">— empty —</div>'
    : [...state.stack].reverse().map((f, i) =>
        `<div class="px-3 py-2 rounded text-[12px] font-mono border transition-all" style="${i === 0 ? 'background:rgba(56,189,248,0.15);border-color:rgba(142,213,255,0.5);color:#8ed5ff;animation:slideIn .15s ease' : 'background:rgba(48,53,57,0.3);border-color:rgba(62,72,79,0.3);color:#bdc8d1'}">
          ${f}
        </div>`
      ).join('');

  // Microtask queue
  pgRenderList('pg-micro', state.micro, '#e1bfff');
  pgRenderList('pg-macro', state.macro, '#7bd0ff');

  // Console
  const conEl = document.getElementById('pg-console');
  conEl.innerHTML = state.output.length === 0
    ? '<div class="text-[11px] text-[#3e484f] font-mono">— no output —</div>'
    : state.output.map(l => `<div class="console-line flex items-start gap-2"><span class="text-[#3e484f] text-[10px] mt-0.5">❯</span><span>${l}</span></div>`).join('');
  conEl.scrollTop = conEl.scrollHeight;

  // Line highlight
  const marker = document.getElementById('pg-line-marker');
  if (state.highlight >= 0) {
    const lineHeight = 20.8;
    const top = state.highlight * lineHeight + 16;
    marker.style.top = top + 'px';
    marker.style.opacity = '1';
    marker.style.height = '20px';
  } else {
    marker.style.opacity = '0';
  }

  // Desc
  if (state.desc) document.getElementById('pg-desc').textContent = state.desc;

  const totalSteps = pgSim.plan ? pgSim.plan.length : 0;
  document.getElementById('pg-status').textContent =
    pgStep >= totalSteps - 1
      ? '✅ Execution complete'
      : `Step ${pgStep + 1} / ${totalSteps} — ${state.desc || 'click step forward'}`;

  document.getElementById('pg-prev-btn').style.opacity = pgStep <= 0 ? '0.4' : '1';
  document.getElementById('pg-step-btn').style.opacity = pgStep >= totalSteps - 1 ? '0.4' : '1';
}

function pgRenderList(id, items, color) {
  const el = document.getElementById(id);
  if (!el) return;
  if (items.length === 0) {
    el.innerHTML = '<div class="text-[11px] text-[#3e484f] font-mono py-1">— empty —</div>';
    return;
  }
  el.innerHTML = items.map(item =>
    `<div class="queue-item px-3 py-1.5 rounded text-[11px] font-mono" style="border:1px solid ${color}40;background:${color}08;color:${color}">
      ${item}
    </div>`
  ).join('');
}

function pgLoadExample(id) {
  pgExampleId = id;
  pgStep = 0;
  const ex = PG_EXAMPLES[id];
  document.getElementById('pg-editor').value = ex.code;
  document.getElementById('pg-desc').textContent = ex.desc;
  pgSim._realPlan(ex.code.split('\n'));

  document.querySelectorAll('[data-pg-example]').forEach(b => b.classList.remove('active'));
  document.querySelector(`[data-pg-example="${id}"]`).classList.add('active');
  pgUpdate();
}

function pgStepForward() {
  const plan = pgSim.plan || [];
  if (pgStep < plan.length - 1) {
    pgStep++;
    pgUpdate();
  }
}

function pgPrev() {
  if (pgStep > 0) {
    pgStep--;
    pgUpdate();
  }
}

function pgReset() {
  pgStep = 0;
  if (pgTimer) { clearInterval(pgTimer); pgTimer = null; document.getElementById('pg-auto-btn').innerHTML = '<span class="text-[18px]">⏩</span> Run All'; }
  const ex = PG_EXAMPLES[pgExampleId];
  pgSim._realPlan(ex.code.split('\n'));
  pgUpdate();
}

function pgAuto() {
  if (pgTimer) {
    clearInterval(pgTimer); pgTimer = null;
    document.getElementById('pg-auto-btn').innerHTML = '<span class="text-[18px]">⏩</span> Run All';
    return;
  }
  if (!pgSim.plan || pgStep >= pgSim.plan.length - 1) pgStep = 0;
  document.getElementById('pg-auto-btn').innerHTML = '<span class="text-[18px]">⏸</span> Pause';
  pgTimer = setInterval(() => {
    if (!pgSim.plan || pgStep >= pgSim.plan.length - 1) { pgAuto(); return; }
    pgStep++; pgUpdate();
  }, 500);
}

function pgClearOutput() {
  document.getElementById('pg-console').innerHTML = '<div class="text-[11px] text-[#3e484f] font-mono">— no output —</div>';
}

function pgRunCustom() {
  pgStep = 0;
  const code = document.getElementById('pg-editor').value;
  pgSim._realPlan(code.split('\n'));
  if (pgTimer) { clearInterval(pgTimer); pgTimer = null; }
  pgAuto();
}

function render_playground() {
  const container = document.getElementById('page-playground');
  if (container.dataset.loaded) return;
  container.innerHTML = PG_HTML;
  container.dataset.loaded = '1';

  document.querySelectorAll('[data-pg-example]').forEach(btn => {
    btn.addEventListener('click', () => pgLoadExample(btn.dataset.pgExample));
  });

  pgLoadExample('basic');
}
