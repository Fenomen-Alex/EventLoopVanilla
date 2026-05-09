// Hoisting & Memory Reference - V8 Engine Memory & Scope

function render_memory() {
  const container = document.getElementById('page-memory');
  if (container.dataset.loaded) return;
  container.innerHTML = `
<div class="max-w-[1400px] mx-auto">
  <div class="mb-8">
    <h2 class="text-[28px] font-bold text-[#8ed5ff]">Hoisting &amp; Memory Reference</h2>
    <p class="text-[14px] text-[#bdc8d1] mt-1 max-w-3xl">V8 engine memory allocation, variable hoisting, and the Temporal Dead Zone (TDZ) during execution context creation.</p>
  </div>

  <div class="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
    <div class="xl:col-span-2 glass-panel p-6">
      <div class="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(62,72,79,0.2)]">
        <span class="text-[18px] text-[#8ed5ff]">📊</span>
        <h3 class="text-[18px] font-bold text-[#dee3e8]">Hoisting Behavior Reference</h3>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full text-left text-[13px]">
          <thead>
            <tr class="border-b border-[rgba(62,72,79,0.5)]">
              <th class="pb-3 pr-4 font-mono text-[11px] text-[#8ed5ff] uppercase tracking-wider">Declaration</th>
              <th class="pb-3 pr-4 font-mono text-[11px] text-[#8ed5ff] uppercase tracking-wider">Hoisted?</th>
              <th class="pb-3 pr-4 font-mono text-[11px] text-[#8ed5ff] uppercase tracking-wider">Initial Value</th>
              <th class="pb-3 font-mono text-[11px] text-[#8ed5ff] uppercase tracking-wider">Scope</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-[rgba(62,72,79,0.2)] hover:bg-[rgba(48,53,57,0.3)] transition-colors">
              <td class="py-2.5 pr-4 font-mono text-[#e1bfff]">var</td>
              <td class="py-2.5 pr-4 text-[#8ed5ff]">Yes</td>
              <td class="py-2.5 pr-4 font-mono text-[#ffb4ab]">undefined</td>
              <td class="py-2.5 text-[#bdc8d1]">Function / Global</td>
            </tr>
            <tr class="border-b border-[rgba(62,72,79,0.2)] hover:bg-[rgba(48,53,57,0.3)] transition-colors">
              <td class="py-2.5 pr-4 font-mono text-[#e1bfff]">let</td>
              <td class="py-2.5 pr-4 text-[#8ed5ff]">Yes</td>
              <td class="py-2.5 pr-4 font-mono text-[#bdc8d1]">&lt;uninitialized&gt; (TDZ)</td>
              <td class="py-2.5 text-[#bdc8d1]">Block</td>
            </tr>
            <tr class="border-b border-[rgba(62,72,79,0.2)] hover:bg-[rgba(48,53,57,0.3)] transition-colors">
              <td class="py-2.5 pr-4 font-mono text-[#e1bfff]">const</td>
              <td class="py-2.5 pr-4 text-[#8ed5ff]">Yes</td>
              <td class="py-2.5 pr-4 font-mono text-[#bdc8d1]">&lt;uninitialized&gt; (TDZ)</td>
              <td class="py-2.5 text-[#bdc8d1]">Block</td>
            </tr>
            <tr class="border-b border-[rgba(62,72,79,0.2)] hover:bg-[rgba(48,53,57,0.3)] transition-colors">
              <td class="py-2.5 pr-4 font-mono text-[#ffed76]">function() {}</td>
              <td class="py-2.5 pr-4 text-[#8ed5ff]">Yes</td>
              <td class="py-2.5 pr-4 font-mono text-[#ffed76]">Function Reference</td>
              <td class="py-2.5 text-[#bdc8d1]">Function / Global</td>
            </tr>
            <tr class="hover:bg-[rgba(48,53,57,0.3)] transition-colors">
              <td class="py-2.5 pr-4 font-mono text-[#e1bfff]">class</td>
              <td class="py-2.5 pr-4 text-[#8ed5ff]">Yes</td>
              <td class="py-2.5 pr-4 font-mono text-[#bdc8d1]">&lt;uninitialized&gt; (TDZ)</td>
              <td class="py-2.5 text-[#bdc8d1]">Block</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="glass-panel p-6 relative overflow-hidden">
      <div class="absolute top-0 right-0 p-4 opacity-[0.08] pointer-events-none text-[100px] text-[#8ed5ff]">🧠</div>
      <div class="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(62,72,79,0.2)] relative z-10">
        <span class="text-[18px] text-[#ffed76]">📚</span>
        <h3 class="text-[18px] font-bold text-[#dee3e8]">Heap vs. Stack</h3>
      </div>
      <div class="flex flex-col gap-4 relative z-10">
        <div class="bg-[#252b2e] p-4 rounded border border-[rgba(62,72,79,0.2)] border-l-4 border-l-[#ffed76]">
          <h4 class="text-[12px] font-mono text-[#ffed76] mb-2 flex items-center gap-1">
            <span class="text-[14px]">📋</span> Call Stack
          </h4>
          <p class="text-[12px] text-[#bdc8d1]">Stores primitives (String, Number, Boolean) and function execution contexts. Fixed size, LIFO structure.</p>
        </div>
        <div class="bg-[#252b2e] p-4 rounded border border-[rgba(62,72,79,0.2)] border-l-4 border-l-[#e1bfff]">
          <h4 class="text-[12px] font-mono text-[#e1bfff] mb-2 flex items-center gap-1">
            <span class="text-[14px]">🔀</span> Memory Heap
          </h4>
          <p class="text-[12px] text-[#bdc8d1]">Stores reference types (Objects, Arrays, Functions). Dynamically allocated. Stack holds pointers to Heap addresses.</p>
        </div>
      </div>
    </div>
  </div>

  <div class="glass-panel p-6 mb-8">
    <div class="flex flex-col md:flex-row gap-8">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-4 pb-3 border-b border-[rgba(62,72,79,0.2)]">
          <span class="text-[18px] text-[#ffb4ab]">⚠️</span>
          <h3 class="text-[18px] font-bold text-[#dee3e8]">Temporal Dead Zone (TDZ)</h3>
        </div>
        <p class="text-[13px] text-[#bdc8d1] mb-4">The TDZ is the period from the start of a block until the initialization of a <code class="text-[#e1bfff] bg-[rgba(225,191,255,0.1)] px-1 rounded">let</code>, <code class="text-[#e1bfff] bg-[rgba(225,191,255,0.1)] px-1 rounded">const</code>, or <code class="text-[#e1bfff] bg-[rgba(225,191,255,0.1)] px-1 rounded">class</code>. Accessing before initialization throws a <code class="text-[#ffb4ab] bg-[rgba(255,180,171,0.1)] px-1 rounded">ReferenceError</code>.</p>
        <div class="bg-[#0a0f12] border border-[rgba(62,72,79,0.3)] rounded-lg p-4 text-[12px] font-mono leading-relaxed overflow-x-auto">
          <span class="text-[#3e484f]">// Global Execution Context</span><br/>
          <span class="text-[#e1bfff]">const</span> globalVar = <span class="text-[#7bd0ff]">"I am safe"</span>;<br/><br/>
          {<br/>
          <span class="text-[#3e484f]">  // Block Scope Starts → TDZ for 'data' Begins</span><br/>
          <span class="text-[#ffed76]">  console</span>.<span class="text-[#8ed5ff]">log</span>(globalVar); <span class="text-[#3e484f]">// OK</span><br/>
          <span class="bg-[rgba(147,0,10,0.3)] block px-2 -mx-2 rounded border-l-2 border-[#ffb4ab] text-[#ffb4ab]">  <span class="text-[#ffed76]">console</span>.<span class="text-[#8ed5ff]">log</span>(data); <span class="text-[#3e484f]">// ReferenceError! Inside TDZ</span></span><br/>
          <span class="text-[#e1bfff]">  let</span> data = <span class="text-[#7bd0ff]">"Initialized"</span>; <span class="text-[#3e484f]">// TDZ Ends Here</span><br/>
          <span class="text-[#ffed76]">  console</span>.<span class="text-[#8ed5ff]">log</span>(data); <span class="text-[#3e484f]">// OK: "Initialized"</span><br/>
          }<br/>
        </div>
      </div>

      <div class="flex-1">
        <div class="bg-[rgba(37,43,46,0.5)] rounded-lg p-5 border border-[rgba(62,72,79,0.2)] relative h-full">
          <div class="absolute inset-0 flex items-center justify-center opacity-[0.04] pointer-events-none">
            <span class="text-[120px] font-mono font-bold">TDZ</span>
          </div>
          <h4 class="text-[13px] font-mono text-[#8ed5ff] mb-4">Stack Frame Diagram</h4>

          <div class="border border-[rgba(62,72,79,0.4)] rounded-lg bg-[#0f1418] p-3 relative mb-3">
            <div class="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#87929a] rounded-full"></div>
            <div class="text-[10px] font-mono text-[#3e484f] mb-1">Global Scope</div>
            <div class="flex justify-between text-[11px] font-mono">
              <span class="text-[#dee3e8]">globalVar</span>
              <span class="text-[#7bd0ff]">"I am safe"</span>
            </div>
          </div>

          <div class="h-6 w-px bg-[rgba(62,72,79,0.5)] ml-4 relative">
            <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-2 h-2 border-r border-b border-[rgba(62,72,79,0.5)] rotate-45"></div>
          </div>

          <div class="border border-[rgba(255,180,171,0.5)] rounded-lg bg-[rgba(147,0,10,0.1)] p-3 relative" style="box-shadow:0 0 15px rgba(147,0,10,0.3)">
            <div class="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#ffb4ab] rounded-full"></div>
            <div class="text-[10px] font-mono text-[#ffb4ab] mb-1 flex justify-between">
              <span>Block Scope (Pre-Init)</span>
              <span class="animate-pulse">TDZ ACTIVE</span>
            </div>
            <div class="flex justify-between text-[11px] font-mono">
              <span class="text-[#dee3e8]">data</span>
              <span class="text-[#bdc8d1] italic">&lt;uninitialized&gt;</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="glass-panel p-6">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-[18px] text-[#8ed5ff]">🔗</span>
        <h3 class="text-[16px] font-bold text-[#dee3e8]">Closure Memory</h3>
      </div>
      <p class="text-[12px] text-[#bdc8d1] leading-relaxed mb-4">When a function "remembers" its lexical environment, the closure variables are stored in the heap, not the stack. This is why closures survive after their outer function returns.</p>
      <div class="bg-[#0a0f12] border border-[rgba(62,72,79,0.3)] rounded-lg p-3 text-[11px] font-mono leading-relaxed">
        <span class="text-[#e1bfff]">function</span> <span class="text-[#8ed5ff]">createCounter</span>() {<br/>
        <span class="text-[#e1bfff]">  let</span> count = <span class="text-[#fce425]">0</span>; <span class="text-[#3e484f]">// stored in heap (closure)</span><br/>
        <span class="text-[#e1bfff]">  return</span> <span class="text-[#e1bfff]">function</span>() {<br/>
        <span class="text-[#ffed76]">    console</span>.<span class="text-[#8ed5ff]">log</span>(++count); <span class="text-[#3e484f]">// count survives!</span><br/>
        };<br/>
        }<br/>
        <span class="text-[#e1bfff]">const</span> c = <span class="text-[#8ed5ff]">createCounter</span>();<br/>
        c(); <span class="text-[#3e484f]">// 1</span><br/>
        c(); <span class="text-[#3e484f]">// 2</span><br/>
      </div>
    </div>

    <div class="glass-panel p-6">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-[18px] text-[#ffed76]">🔄</span>
        <h3 class="text-[16px] font-bold text-[#dee3e8]">Scope Chain</h3>
      </div>
      <p class="text-[12px] text-[#bdc8d1] leading-relaxed mb-4">Each execution context has a reference to its outer environment. Variable resolution walks up the scope chain until found or throws ReferenceError.</p>
      <div class="bg-[#0a0f12] border border-[rgba(62,72,79,0.3)] rounded-lg p-3 text-[11px] font-mono leading-relaxed">
        <span class="text-[#e1bfff]">const</span> x = <span class="text-[#fce425]">'global'</span>;<br/>
        <span class="text-[#e1bfff]">function</span> <span class="text-[#8ed5ff]">outer</span>() {<br/>
        <span class="text-[#e1bfff]">  const</span> x = <span class="text-[#fce425]">'outer'</span>;<br/>
        <span class="text-[#e1bfff]">  function</span> <span class="text-[#8ed5ff]">inner</span>() {<br/>
        <span class="text-[#ffed76]">    console</span>.<span class="text-[#8ed5ff]">log</span>(x); <span class="text-[#3e484f]">// 'outer' (scope chain)</span><br/>
        }<br/>
        <span class="text-[#8ed5ff]">  inner</span>();<br/>
        }<br/>
        <span class="text-[#8ed5ff]">outer</span>();<br/>
      </div>
    </div>
  </div>
</div>`;
  container.dataset.loaded = '1';
}
