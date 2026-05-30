// Node.js Deep Dive - libuv Event Loop Anatomy

function render_nodejs() {
  const container = document.getElementById('page-nodejs');
  if (container.dataset.loaded) return;
  container.innerHTML = `
<div class="max-w-[1400px] mx-auto">
  <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
    <div>
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(142,213,255,0.1)] border border-[rgba(142,213,255,0.3)] text-[#8ed5ff]">ENV: NODE.JS</span>
        <span class="text-[11px] font-mono text-[#bdc8d1]">PID: 4992</span>
      </div>
      <h2 class="text-[28px] font-bold text-[#dee3e8]">Node.js Environment Deep Dive</h2>
      <p class="text-[14px] text-[#bdc8d1] mt-1 max-w-2xl">Understanding the libuv event loop phases and how microtasks interrupt between every phase.</p>
    </div>
    <div class="glass-panel px-4 py-3 flex items-center gap-3 border-l-4 border-l-[#ffed76]">
      <div class="flex flex-col">
        <span class="text-[10px] font-mono text-[#bdc8d1]">Current Phase</span>
        <span class="text-[13px] font-mono text-[#ffed76]" id="nodejs-phase">Poll</span>
      </div>
      <div class="w-10 h-10 rounded-full border-2 border-[rgba(255,237,118,0.3)] flex items-center justify-center relative">
        <div class="absolute inset-0 border-t-2 border-[#ffed76] rounded-full" id="nodejs-spinner"></div>
        <span class="text-[16px] text-[#ffed76]">⟳</span>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
    <div class="xl:col-span-2 glass-panel p-6 relative overflow-hidden">
      <div class="absolute top-0 right-0 w-[400px] h-[400px] bg-[rgba(142,213,255,0.03)] rounded-full blur-[80px] pointer-events-none"></div>
      <h3 class="text-[20px] font-bold text-[#dee3e8] mb-6">libuv Event Loop Phases</h3>
      <div class="flex flex-col items-center relative z-10">
        <div class="w-full max-w-[500px]">
          <div class="flex justify-center mb-4">
            <div class="bg-[#252b2e] border border-[rgba(225,191,255,0.3)] text-[#e1bfff] px-4 py-2 rounded-full text-[11px] font-mono flex items-center gap-2 shadow-[0_0_15px_rgba(225,191,255,0.1)]">
              <span class="text-[14px]">⚡</span> process.nextTick() &amp; Microtasks drain between EVERY phase
            </div>
          </div>

          <div id="nodejs-phase-timers" class="flex items-center justify-between p-4 mb-3 rounded-xl border border-[rgba(62,72,79,0.3)] bg-[rgba(37,43,46,0.9)] border-l-4 transition-all duration-300 cursor-pointer hover:border-l-[#8ed5ff]" style="border-left-color:#8ed5ff">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-[#0a0f12] border border-[rgba(62,72,79,0.2)]"><span class="text-[20px] text-[#8ed5ff]">⏰</span></div>
              <span class="text-[15px] font-mono font-bold text-[#dee3e8]">1. Timers</span>
            </div>
            <span class="text-[11px] text-[#bdc8d1] font-mono">setTimeout, setInterval</span>
          </div>

          <div class="flex items-center justify-center h-12 relative">
            <div class="absolute bg-[#0a0f12] border border-[rgba(225,191,255,0.3)] text-[#e1bfff] px-3 py-1 rounded-full text-[10px] font-mono z-10 shadow-[0_0_10px_rgba(225,191,255,0.05)]">Microtask check</div>
            <span class="text-[#3e484f]">↓</span>
          </div>

          <div id="nodejs-phase-pending" class="flex items-center justify-between p-4 mb-3 rounded-xl border border-[rgba(62,72,79,0.3)] bg-[rgba(37,43,46,0.9)] border-l-4 transition-all duration-300 cursor-pointer hover:border-l-[#bdc8d1]" style="border-left-color:#bdc8d1">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-[#0a0f12] border border-[rgba(62,72,79,0.2)]"><span class="text-[20px] text-[#87929a]">⏳</span></div>
              <span class="text-[15px] font-mono font-bold text-[#dee3e8]">2. Pending Callbacks</span>
            </div>
            <span class="text-[11px] text-[#bdc8d1] font-mono">I/O error callbacks</span>
          </div>

          <div class="flex items-center justify-center h-12 relative">
            <div class="absolute bg-[#0a0f12] border border-[rgba(225,191,255,0.3)] text-[#e1bfff] px-3 py-1 rounded-full text-[10px] font-mono z-10 shadow-[0_0_10px_rgba(225,191,255,0.05)]">Microtask check</div>
            <span class="text-[#3e484f]">↓</span>
          </div>

          <div id="nodejs-phase-idle" class="flex items-center justify-between p-4 mb-3 rounded-xl border border-[rgba(62,72,79,0.3)] bg-[rgba(37,43,46,0.9)] border-l-4 transition-all duration-300 cursor-pointer hover:border-l-[#87929a]" style="border-left-color:#87929a">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-[#0a0f12] border border-[rgba(62,72,79,0.2)]"><span class="text-[20px] text-[#87929a]">🔧</span></div>
              <span class="text-[15px] font-mono font-bold text-[#dee3e8]">3. Idle / Prepare</span>
            </div>
            <span class="text-[11px] text-[#bdc8d1] font-mono">libuv internal</span>
          </div>

          <div class="flex items-center justify-center h-12 relative">
            <div class="absolute bg-[#0a0f12] border border-[rgba(225,191,255,0.3)] text-[#e1bfff] px-3 py-1 rounded-full text-[10px] font-mono z-10 shadow-[0_0_10px_rgba(225,191,255,0.05)]">Microtask check</div>
            <span class="text-[#3e484f]">↓</span>
          </div>

          <div id="nodejs-phase-poll" class="flex items-center justify-between p-4 mb-3 rounded-xl border border-[rgba(62,72,79,0.3)] bg-[rgba(37,43,46,0.9)] border-l-4 transition-all duration-300 scale-[1.02] shadow-[0_0_25px_rgba(255,237,118,0.1)]" style="border-left-color:#ffed76">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-[rgba(255,237,118,0.1)] border border-[rgba(255,237,118,0.3)]"><span class="text-[20px] text-[#ffed76]">🔄</span></div>
              <span class="text-[15px] font-mono font-bold text-[#dee3e8]">4. Poll <span class="text-[9px] font-mono text-[#ffed76] bg-[rgba(255,237,118,0.1)] px-1.5 py-0.5 rounded ml-2">ACTIVE</span></span>
            </div>
            <span class="text-[11px] text-[#bdc8d1] font-mono">I/O callbacks</span>
          </div>

          <div class="flex items-center justify-center h-12 relative">
            <div class="absolute bg-[#0a0f12] border border-[rgba(225,191,255,0.3)] text-[#e1bfff] px-3 py-1 rounded-full text-[10px] font-mono z-10 shadow-[0_0_10px_rgba(225,191,255,0.05)]">Microtask check</div>
            <span class="text-[#3e484f]">↓</span>
          </div>

          <div id="nodejs-phase-check" class="flex items-center justify-between p-4 mb-3 rounded-xl border border-[rgba(62,72,79,0.3)] bg-[rgba(37,43,46,0.9)] border-l-4 transition-all duration-300 cursor-pointer hover:border-l-[#7bd0ff]" style="border-left-color:#7bd0ff">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-[#0a0f12] border border-[rgba(62,72,79,0.2)]"><span class="text-[20px] text-[#7bd0ff]">✅</span></div>
              <span class="text-[15px] font-mono font-bold text-[#dee3e8]">5. Check</span>
            </div>
            <span class="text-[11px] text-[#bdc8d1] font-mono">setImmediate</span>
          </div>

          <div class="flex items-center justify-center h-12 relative">
            <div class="absolute bg-[#0a0f12] border border-[rgba(225,191,255,0.3)] text-[#e1bfff] px-3 py-1 rounded-full text-[10px] font-mono z-10 shadow-[0_0_10px_rgba(225,191,255,0.05)]">Microtask check</div>
            <span class="text-[#3e484f]">↓</span>
          </div>

          <div id="nodejs-phase-close" class="flex items-center justify-between p-4 rounded-xl border border-[rgba(62,72,79,0.3)] bg-[rgba(37,43,46,0.9)] border-l-4 transition-all duration-300 cursor-pointer hover:border-l-[#ffb4ab]" style="border-left-color:#ffb4ab">
            <div class="flex items-center gap-3">
              <div class="p-2 rounded-lg bg-[#0a0f12] border border-[rgba(62,72,79,0.2)]"><span class="text-[20px] text-[#ffb4ab]">✕</span></div>
              <span class="text-[15px] font-mono font-bold text-[#dee3e8]">6. Close Callbacks</span>
            </div>
            <span class="text-[11px] text-[#bdc8d1] font-mono">socket.on('close')</span>
          </div>
        </div>
      </div>
    </div>

    <div class="glass-panel p-6 flex flex-col gap-4 relative overflow-hidden">
      <div class="absolute bottom-0 right-0 w-[200px] h-[200px] bg-[rgba(225,191,255,0.03)] rounded-full blur-[60px] pointer-events-none"></div>
      <h3 class="text-[18px] font-bold text-[#e1bfff] flex items-center gap-2">
        <span class="text-[22px]">⚡</span> The In-Between
      </h3>
      <p class="text-[13px] text-[#bdc8d1] leading-relaxed">
        <code class="text-[#e1bfff] bg-[rgba(225,191,255,0.1)] px-1 rounded text-[12px]">process.nextTick()</code> and Promise microtasks <strong>do not belong to the libuv event loop.</strong>
      </p>
      <p class="text-[13px] text-[#bdc8d1] leading-relaxed">
        They execute <em>between every single phase</em> of the main loop. The microtask queue is drained entirely before the next phase begins.
      </p>

      <div class="mt-auto bg-[#0a0f12] p-4 rounded-xl border border-[rgba(62,72,79,0.3)]">
        <p class="text-[10px] text-[#bdc8d1] font-mono mb-3 pb-2 border-b border-[rgba(62,72,79,0.2)]">Execution Priority</p>
        <div class="flex items-center gap-3 text-[12px] font-mono mb-2">
          <span class="text-[#3e484f] w-4 text-right">1</span>
          <span class="text-[#dee3e8]">Synchronous Code</span>
        </div>
        <div class="flex items-center gap-3 text-[12px] font-mono mb-2 bg-[rgba(225,191,255,0.1)] -mx-2 px-2 py-1 rounded border border-[rgba(225,191,255,0.2)]">
          <span class="text-[#e1bfff] w-4 text-right font-bold">2</span>
          <span class="text-[#e1bfff]">process.nextTick() Queue</span>
        </div>
        <div class="flex items-center gap-3 text-[12px] font-mono mb-2">
          <span class="text-[#ddb7ff] w-4 text-right">3</span>
          <span class="text-[#bdc8d1]">Microtask Queue (Promises)</span>
        </div>
        <div class="flex items-center gap-3 text-[12px] font-mono pt-2 border-t border-[rgba(62,72,79,0.2)]">
          <span class="text-[#3e484f] w-4 text-right">4</span>
          <span class="text-[#87929a]">Event Loop Phase Callback</span>
        </div>
      </div>
    </div>
  </div>

  <div class="mb-4">
    <h3 class="text-[22px] font-bold text-[#dee3e8] mb-4 pb-2 border-b border-[rgba(62,72,79,0.2)] inline-block">Complete Phase Anatomy</h3>
  </div>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <div class="glass-panel p-4 group hover:border-[rgba(142,213,255,0.4)] transition-colors relative overflow-hidden">
      <div class="absolute top-0 left-0 w-1 h-full bg-[#8ed5ff]"></div>
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[18px] text-[#8ed5ff]">⏰</span>
        <h4 class="text-[14px] font-mono font-bold text-[#dee3e8]">Timers</h4>
      </div>
      <p class="text-[12px] text-[#bdc8d1] leading-relaxed">Executes callbacks scheduled by <code class="text-[#8ed5ff]">setTimeout()</code> and <code class="text-[#8ed5ff]">setInterval()</code>. The loop guarantees execution <em>after</em> the threshold, not exactly at it.</p>
    </div>
    <div class="glass-panel p-4 group hover:border-[rgba(135,146,154,0.4)] transition-colors relative overflow-hidden">
      <div class="absolute top-0 left-0 w-1 h-full bg-[#87929a]"></div>
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[18px] text-[#87929a]">⏳</span>
        <h4 class="text-[14px] font-mono font-bold text-[#dee3e8]">Pending Callbacks</h4>
      </div>
      <p class="text-[12px] text-[#bdc8d1] leading-relaxed">Executes I/O callbacks deferred to the next loop iteration. Often reserved for system-level operations like TCP socket errors (<code class="text-[#8ed5ff]">ECONNREFUSED</code>).</p>
    </div>
    <div class="glass-panel p-4 group hover:border-[rgba(135,146,154,0.4)] transition-colors relative overflow-hidden">
      <div class="absolute top-0 left-0 w-1 h-full bg-[#87929a]"></div>
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[18px] text-[#87929a]">🔧</span>
        <h4 class="text-[14px] font-mono font-bold text-[#dee3e8]">Idle / Prepare</h4>
      </div>
      <p class="text-[12px] text-[#bdc8d1] leading-relaxed">Used strictly internally by libuv for housekeeping. No application code executes here. Sets up the polling mechanism for the next phase.</p>
    </div>
    <div class="glass-panel p-4 border-[rgba(255,237,118,0.3)] relative overflow-hidden" style="box-shadow:inset 0 0 15px rgba(255,237,118,0.05)">
      <div class="absolute top-0 left-0 w-1 h-full bg-[#ffed76]"></div>
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[18px] text-[#ffed76]">🔄</span>
        <h4 class="text-[14px] font-mono font-bold text-[#dee3e8]">Poll <span class="text-[9px] font-mono text-[#ffed76] bg-[rgba(255,237,118,0.1)] px-1.5 py-0.5 rounded ml-1">CURRENT</span></h4>
      </div>
      <p class="text-[12px] text-[#bdc8d1] leading-relaxed">Retrieves new I/O events; executes I/O related callbacks (excluding close, timers, and setImmediate). Node will block here if the queue is empty.</p>
    </div>
    <div class="glass-panel p-4 group hover:border-[rgba(123,208,255,0.4)] transition-colors relative overflow-hidden">
      <div class="absolute top-0 left-0 w-1 h-full bg-[#7bd0ff]"></div>
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[18px] text-[#7bd0ff]">✅</span>
        <h4 class="text-[14px] font-mono font-bold text-[#dee3e8]">Check</h4>
      </div>
      <p class="text-[12px] text-[#bdc8d1] leading-relaxed">Dedicated exclusively to <code class="text-[#7bd0ff]">setImmediate()</code> callbacks. Allows execution of scripts immediately after the poll phase completes.</p>
    </div>
    <div class="glass-panel p-4 group hover:border-[rgba(255,180,171,0.4)] transition-colors relative overflow-hidden">
      <div class="absolute top-0 left-0 w-1 h-full bg-[#ffb4ab]"></div>
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[18px] text-[#ffb4ab]">✕</span>
        <h4 class="text-[14px] font-mono font-bold text-[#dee3e8]">Close Callbacks</h4>
      </div>
      <p class="text-[12px] text-[#bdc8d1] leading-relaxed">Executes cleanup operations, such as <code class="text-[#ffb4ab]">socket.on('close', ...)</code>. Ensures resources are gracefully destroyed before the loop exits.</p>
    </div>
  </div>
</div>`;
  container.dataset.loaded = '1';

  // Clear previous interval if any
  if (window._nodejsInterval) clearInterval(window._nodejsInterval);

  // Animate the phase names cycling
  const phases = ['Timers', 'Pending Callbacks', 'Idle / Prepare', 'Poll', 'Check', 'Close Callbacks'];
  let phaseIdx = 3;
  const phaseEl = document.getElementById('nodejs-phase');
  const spinner = document.getElementById('nodejs-spinner');
  if (spinner) spinner.style.animation = 'spin 3s linear infinite';

  window._nodejsInterval = setInterval(() => {
    phaseIdx = (phaseIdx + 1) % phases.length;
    if (phaseEl) phaseEl.textContent = phases[phaseIdx];

    const ids = ['timers','pending','idle','poll','check','close'];
    ids.forEach((id, i) => {
      const el = document.getElementById('nodejs-phase-' + id);
      if (!el) return;
      if (i === phaseIdx) {
        el.style.borderLeftColor = '#ffed76';
        el.style.transform = 'scale(1.02)';
        el.style.boxShadow = '0 0 25px rgba(255,237,118,0.1)';
      } else {
        el.style.transform = 'scale(1)';
        el.style.boxShadow = 'none';
        const colors = ['#8ed5ff', '#bdc8d1', '#87929a', '#ffed76', '#7bd0ff', '#ffb4ab'];
        el.style.borderLeftColor = colors[i];
      }
    });
  }, 2500);
}
