// Browser Environment Deep Dive - Rendering Pipeline & Web APIs

function render_browser() {
  const container = document.getElementById('page-browser');
  if (container.dataset.loaded) return;
  container.innerHTML = `
<div class="max-w-[1400px] mx-auto">
  <div class="flex items-center justify-between mb-8 flex-wrap gap-4">
    <div>
      <div class="flex items-center gap-2 mb-2">
        <span class="text-[10px] font-mono px-2 py-0.5 rounded bg-[rgba(142,213,255,0.1)] border border-[rgba(142,213,255,0.3)] text-[#8ed5ff]">ENV: BROWSER</span>
        <span class="text-[11px] font-mono text-[#bdc8d1]">PID: 4992</span>
      </div>
      <h2 class="text-[28px] font-bold text-[#dee3e8]">Browser Execution Environment</h2>
      <p class="text-[14px] text-[#bdc8d1] mt-1 max-w-2xl">Deep dive into the browser's event loop: rendering pipeline, requestAnimationFrame, and how UI events interact with the task queues.</p>
    </div>
    <div class="glass-panel px-4 py-3 flex items-center gap-3 border-l-4 border-l-[#fce425]">
      <div class="flex flex-col">
        <span class="text-[10px] font-mono text-[#bdc8d1]">Pipeline Status</span>
        <span class="text-[13px] font-mono text-[#fce425]">IDLE_WAITING</span>
      </div>
      <div class="w-10 h-10 rounded-full border-2 border-[rgba(252,228,37,0.3)] flex items-center justify-center relative">
        <div class="absolute inset-0 border-t-2 border-[#fce425] rounded-full animate-spin"></div>
        <span class="text-[16px] text-[#fce425]">⟳</span>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
    <div class="lg:col-span-5 flex flex-col gap-6">
      <div class="glass-panel p-5 border-l-4 border-l-[#e1bfff] relative overflow-hidden">
        <div class="absolute -right-4 -top-4 text-[rgba(225,191,255,0.05)] text-[100px] pointer-events-none">☰</div>
        <h3 class="text-[14px] font-bold text-[#e1bfff] flex items-center gap-2 mb-4">
          <span class="text-[18px]">👆</span> UI Events &amp; Macro Tasks
        </h3>
        <div class="space-y-3">
          <div class="bg-[rgba(10,15,18,0.5)] border border-[rgba(62,72,79,0.3)] rounded-lg p-3 flex items-start gap-3">
            <div class="mt-1 w-2 h-2 rounded-full bg-[#e1bfff] shadow-[0_0_8px_rgba(225,191,255,0.6)] shrink-0"></div>
            <div class="flex-1">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[12px] font-mono text-[#dee3e8]">MouseEvent: click</span>
                <span class="text-[9px] font-mono text-[#bdc8d1] bg-[#1b2024] px-1.5 py-0.5 rounded">MacroQueue</span>
              </div>
              <code class="text-[11px] font-mono text-[#bdc8d1] bg-[#0f1418] p-1.5 rounded block border border-[rgba(62,72,79,0.2)]">
                <span class="text-[#8ed5ff]">button</span>.<span class="text-[#ddb7ff]">addEventListener</span>(<span class="text-[#fce425]">'click'</span>, handler)
              </code>
            </div>
          </div>
          <div class="bg-[rgba(10,15,18,0.5)] border border-[rgba(62,72,79,0.3)] rounded-lg p-3 flex items-start gap-3 opacity-60">
            <div class="mt-1 w-2 h-2 rounded-full bg-[#3e484f] shrink-0"></div>
            <div class="flex-1">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[12px] font-mono text-[#dee3e8]">setTimeout</span>
                <span class="text-[9px] font-mono text-[#bdc8d1] bg-[#1b2024] px-1.5 py-0.5 rounded">MacroQueue</span>
              </div>
              <code class="text-[11px] font-mono text-[#bdc8d1] bg-[#0f1418] p-1.5 rounded block border border-[rgba(62,72,79,0.2)]">
                <span class="text-[#ddb7ff]">setTimeout</span>(cb, <span class="text-[#fce425]">16</span>)
              </code>
            </div>
          </div>
          <div class="bg-[rgba(10,15,18,0.5)] border border-[rgba(62,72,79,0.3)] rounded-lg p-3 flex items-start gap-3 opacity-60">
            <div class="mt-1 w-2 h-2 rounded-full bg-[#3e484f] shrink-0"></div>
            <div class="flex-1">
              <div class="flex justify-between items-center mb-1">
                <span class="text-[12px] font-mono text-[#dee3e8]">fetch()</span>
                <span class="text-[9px] font-mono text-[#bdc8d1] bg-[#1b2024] px-1.5 py-0.5 rounded">Micro/Macro</span>
              </div>
              <code class="text-[11px] font-mono text-[#bdc8d1] bg-[#0f1418] p-1.5 rounded block border border-[rgba(62,72,79,0.2)]">
                <span class="text-[#8ed5ff]">fetch</span>(<span class="text-[#fce425]">'/api'</span>).<span class="text-[#8ed5ff]">then</span>(res =&gt; ...)
              </code>
            </div>
          </div>
        </div>
      </div>

      <div class="glass-panel p-5 border-l-4 border-l-[#fce425] relative" style="box-shadow:0 0 10px rgba(252,228,37,0.15)">
        <h3 class="text-[14px] font-bold text-[#fce425] flex items-center gap-2 mb-3">
          <span class="text-[18px]">🎞️</span> Animation Frame Callbacks
        </h3>
        <p class="text-[12px] text-[#bdc8d1] mb-4">Executes just before the Rendering Pipeline. Ideal for visual updates to ensure they are painted in the next frame.</p>
        <div class="bg-[rgba(10,15,18,0.5)] border border-[rgba(62,72,79,0.3)] rounded-lg p-3 relative">
          <div class="absolute left-0 top-4 bottom-4 w-px bg-[rgba(252,228,37,0.5)]"></div>
          <div class="pl-3 mb-2 flex items-center justify-between">
            <span class="text-[12px] font-mono text-[#dee3e8]">requestAnimationFrame()</span>
            <span class="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[rgba(252,228,37,0.1)] text-[#fce425]">High Priority</span>
          </div>
          <pre class="text-[11px] font-mono text-[#bdc8d1] bg-[#0f1418] p-2 rounded border border-[rgba(62,72,79,0.2)] overflow-x-auto"><code><span class="text-[#ddb7ff]">function</span> <span class="text-[#8ed5ff]">updateUI</span>(timestamp) {
  element.style.transform = <span class="text-[#fce425]">\`translateX(\${pos}px)\`</span>;
  <span class="text-[#ddb7ff]">requestAnimationFrame</span>(updateUI);
}</code></pre>
        </div>
      </div>
    </div>

    <div class="lg:col-span-7">
      <div class="glass-panel p-6 h-full" style="background:linear-gradient(to bottom, rgba(27,32,36,0.8), rgba(15,20,24,0.9))">
        <div class="flex items-center justify-between mb-6 pb-3 border-b border-[rgba(62,72,79,0.2)]">
          <h3 class="text-[14px] font-bold text-[#8ed5ff] flex items-center gap-2">
            <span class="text-[18px]">📊</span> Rendering Pipeline
          </h3>
          <div class="flex items-center gap-1 text-[11px] font-mono text-[#bdc8d1]">
            <span class="text-[14px]">⚡</span> ~16.6ms budget
          </div>
        </div>

        <div class="flex flex-col gap-5 relative">
          <div class="absolute left-[19px] top-10 bottom-10 w-0.5 bg-[rgba(62,72,79,0.3)]"></div>

          <div class="flex gap-4 items-start group relative z-10">
            <div class="w-10 h-10 rounded-full bg-[#252b2e] border-2 border-[#8ed5ff] flex items-center justify-center shrink-0" style="box-shadow:0 0 15px rgba(142,213,255,0.2);margin-top:-2px">
              <span class="text-[18px] text-[#8ed5ff]">🎨</span>
            </div>
            <div class="flex-1 bg-[rgba(10,15,18,0.5)] border border-[rgba(62,72,79,0.3)] rounded-lg p-3 group-hover:border-[rgba(142,213,255,0.5)] transition-colors">
              <h4 class="text-[12px] font-mono text-[#8ed5ff] mb-1">1. Style Calculation</h4>
              <p class="text-[11px] text-[#bdc8d1]">Recalculates styles for elements based on CSSOM and DOM tree modifications.</p>
            </div>
          </div>

          <div class="flex gap-4 items-start group relative z-10">
            <div class="w-10 h-10 rounded-full bg-[#252b2e] border-2 border-[#e1bfff] flex items-center justify-center shrink-0 group-hover:shadow-[0_0_20px_rgba(225,191,255,0.3)] transition-all" style="margin-top:-2px">
              <span class="text-[18px] text-[#e1bfff]">📐</span>
            </div>
            <div class="flex-1 bg-[rgba(10,15,18,0.5)] border border-[rgba(62,72,79,0.3)] rounded-lg p-3 group-hover:border-[rgba(225,191,255,0.5)] transition-colors">
              <h4 class="text-[12px] font-mono text-[#e1bfff] mb-1">2. Layout (Reflow)</h4>
              <p class="text-[11px] text-[#bdc8d1]">Calculates the exact position and size of every element. <strong class="text-[#ffb4ab]">Expensive.</strong></p>
              <div class="mt-2 flex gap-1 flex-wrap">
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[rgba(147,0,10,0.2)] text-[#ffb4ab] border border-[rgba(255,180,171,0.3)]">Triggers: width, height, margin</span>
              </div>
            </div>
          </div>

          <div class="flex gap-4 items-start group relative z-10">
            <div class="w-10 h-10 rounded-full bg-[#252b2e] border-2 border-[#ffed76] flex items-center justify-center shrink-0 group-hover:shadow-[0_0_20px_rgba(255,237,118,0.3)] transition-all" style="margin-top:-2px">
              <span class="text-[18px] text-[#ffed76]">🖌️</span>
            </div>
            <div class="flex-1 bg-[rgba(10,15,18,0.5)] border border-[rgba(62,72,79,0.3)] rounded-lg p-3 group-hover:border-[rgba(255,237,118,0.5)] transition-colors">
              <h4 class="text-[12px] font-mono text-[#ffed76] mb-1">3. Paint</h4>
              <p class="text-[11px] text-[#bdc8d1]">Fills in pixels for each visual part (colors, borders, shadows) into layers.</p>
              <div class="mt-2 flex gap-1 flex-wrap">
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[rgba(255,237,118,0.1)] text-[#ffed76] border border-[rgba(255,237,118,0.3)]">Triggers: color, bg-color, box-shadow</span>
              </div>
            </div>
          </div>

          <div class="flex gap-4 items-start group relative z-10">
            <div class="w-10 h-10 rounded-full bg-[#252b2e] border-2 border-[#c4e7ff] flex items-center justify-center shrink-0 group-hover:shadow-[0_0_20px_rgba(196,231,255,0.3)] transition-all" style="margin-top:-2px">
              <span class="text-[18px] text-[#c4e7ff]">📑</span>
            </div>
            <div class="flex-1 bg-[rgba(10,15,18,0.5)] border border-[rgba(62,72,79,0.3)] rounded-lg p-3 group-hover:border-[rgba(196,231,255,0.5)] transition-colors">
              <h4 class="text-[12px] font-mono text-[#c4e7ff] mb-1">4. Composite Layers</h4>
              <p class="text-[11px] text-[#bdc8d1]">Draws painted layers onto the screen in correct order. <strong>GPU accelerated.</strong></p>
              <div class="mt-2 flex gap-1 flex-wrap">
                <span class="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[rgba(196,231,255,0.1)] text-[#c4e7ff] border border-[rgba(196,231,255,0.3)]">Triggers: transform, opacity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="glass-panel p-6">
    <h3 class="text-[18px] font-bold text-[#dee3e8] mb-4">Browser Event Loop Task Sources</h3>
    <div class="overflow-x-auto">
      <table class="w-full text-left text-[13px]">
        <thead>
          <tr class="border-b border-[rgba(62,72,79,0.5)]">
            <th class="pb-3 pr-4 font-mono text-[11px] text-[#8ed5ff] uppercase tracking-wider">Source</th>
            <th class="pb-3 pr-4 font-mono text-[11px] text-[#8ed5ff] uppercase tracking-wider">Queue</th>
            <th class="pb-3 pr-4 font-mono text-[11px] text-[#8ed5ff] uppercase tracking-wider">Priority</th>
            <th class="pb-3 font-mono text-[11px] text-[#8ed5ff] uppercase tracking-wider">Timing</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-[rgba(62,72,79,0.2)] hover:bg-[rgba(48,53,57,0.3)] transition-colors">
            <td class="py-3 pr-4 font-mono text-[#dee3e8]">Synchronous JS</td>
            <td class="py-3 pr-4 text-[#bdc8d1]">Call Stack</td>
            <td class="py-3 pr-4"><span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[rgba(255,237,118,0.1)] text-[#ffed76]">Highest</span></td>
            <td class="py-3 text-[#bdc8d1]">Immediate</td>
          </tr>
          <tr class="border-b border-[rgba(62,72,79,0.2)] hover:bg-[rgba(48,53,57,0.3)] transition-colors">
            <td class="py-3 pr-4 font-mono text-[#dee3e8]">Promise.then / queueMicrotask</td>
            <td class="py-3 pr-4 text-[#bdc8d1]">Microtask Queue</td>
            <td class="py-3 pr-4"><span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[rgba(225,191,255,0.1)] text-[#e1bfff]">High</span></td>
            <td class="py-3 text-[#bdc8d1]">After current task</td>
          </tr>
          <tr class="border-b border-[rgba(62,72,79,0.2)] hover:bg-[rgba(48,53,57,0.3)] transition-colors">
            <td class="py-3 pr-4 font-mono text-[#dee3e8]">requestAnimationFrame</td>
            <td class="py-3 pr-4 text-[#bdc8d1]">rAF Queue</td>
            <td class="py-3 pr-4"><span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[rgba(252,228,37,0.1)] text-[#fce425]">Before Render</span></td>
            <td class="py-3 text-[#bdc8d1]">Before style/layout/paint</td>
          </tr>
          <tr class="border-b border-[rgba(62,72,79,0.2)] hover:bg-[rgba(48,53,57,0.3)] transition-colors">
            <td class="py-3 pr-4 font-mono text-[#dee3e8]">UI Events (click, keydown)</td>
            <td class="py-3 pr-4 text-[#bdc8d1]">Macrotask Queue</td>
            <td class="py-3 pr-4"><span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[rgba(142,213,255,0.1)] text-[#8ed5ff]">Medium</span></td>
            <td class="py-3 text-[#bdc8d1]">Queued by browser</td>
          </tr>
          <tr class="hover:bg-[rgba(48,53,57,0.3)] transition-colors">
            <td class="py-3 pr-4 font-mono text-[#dee3e8]">setTimeout / setInterval</td>
            <td class="py-3 pr-4 text-[#bdc8d1]">Macrotask Queue</td>
            <td class="py-3 pr-4"><span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[rgba(142,213,255,0.1)] text-[#8ed5ff]">Medium</span></td>
            <td class="py-3 text-[#bdc8d1]">After delay + macrotask wait</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>`;
  container.dataset.loaded = '1';
}
