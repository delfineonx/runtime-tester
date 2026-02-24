
---

<div align="center">
  <h1>Runtime Tester</h1>
  <p>
    Microbenchmark tool that runs repeatable, controlled iteration-based tests.<br>
    Uses robust statistics to reduce noise from jitter and occasional spikes,<br>
    and outputs runtime cost estimates suitable for comparisons across sessions.
  </p>
  <p>
    <a href="#installation"><kbd>Installation</kbd></a> &nbsp;•&nbsp;
    <a href="#api-methods"><kbd>API Methods</kbd></a> &nbsp;•&nbsp;
    <a href="#workflow"><kbd>Workflow</kbd></a> &nbsp;•&nbsp;
    <a href="#analysis"><kbd>Analysis</kbd></a> &nbsp;•&nbsp;
    <a href="#output-format"><kbd>Output Format</kbd></a> &nbsp;•&nbsp;
    <a href="#license-and-credits"><kbd>License & Credits</kbd></a>
  </p>
</div>

---

<a id="installation"></a>
<details open>
  <summary>
    <div align="center">
      <h2>❮ <code><b>📥 Installation 📥</b></code> ❯</h2>
    </div>
  </summary>

  <ol>
    <li>
      Copy the tester source to your <code>World Code</code>:
      <h3>
        <a href="./src/runtime_tester_minified.js"><code><b>minified</b></code></a>  OR  <a href="./src/runtime_tester_original.js"><code><b>original</b></code></a>
      </h3>
      <blockquote>
        <p>
          If you use <a href="https://github.com/delfineonx/code-loader"><code>Code Loader</code></a>,
          you can also store the source in a code block and load it from there.
        </p>
      </blockquote>
    </li>
    <li>
      Put the tester runner always at the start of your <code>tick</code> callback:
    </li>
  </ol>

```js
const _RT_tick = RT.tick_light;
// const _RT_tick = RT.tick_heavy;

tick = () => {
  _RT_tick();
  // ...your other logic
};
```

  <blockquote>
    <p>
      <code><b>! NOTE</b></code><br>
      Benchmarking may be sensitive to extra work. For best accuracy keep the environment idle:<br>
      stop heavy lobby scripts and minimize background activity while collecting samples.
    </p>
  </blockquote>

</details>

---

<a id="api-methods"></a>
<details open>
  <summary>
    <div align="center">
      <h2>❮ <code><b>📚 API Methods 📚</b></code> ❯</h2>
    </div>
  </summary>

  <p>The tool is exposed as <code>globalThis.RT</code> / <code>RT</code>.</p>

```js
/**
 * Styles used for logs (StyledText).
 * 
 * Format:
 * - [color, fontWeight, fontSize] repeated for:
 *   0 = error, 1 = warning, 2 = success, 3 = info
 * 
 * @type {Array<string|number>}
 */
styles
```

```js
/**
 * Function under test (A).
 * 
 * Notes:
 * - Default is a no-op: `() => {}`
 * 
 * @type {() => void}
 */
func_A
```

```js
/**
 * Baseline function (B).
 * 
 * Notes:
 * - Default is a no-op: `() => {}`
 * - Keep it no-op for clean TU scaling.
 * 
 * @type {() => void}
 */
func_B
```

```js
/**
 * Collected raw iteration samples.
 * 
 * Light mode:
 * - `samples_A` = test consumed iterations
 * - `samples_B` = baseline iterations
 * 
 * Heavy mode:
 * - `samples_A` = test remainder iterations
 * - `samples_B` = baseline iterations
 * 
 * Notes:
 * - Analysis sorts these arrays in-place.
 * 
 * @type {number[]}
 */
samples_A
samples_B
```

```js
/**
 * Complete tool installation.
 * 
 * Notes:
 * - The published build calls this once automatically.
 */
init()
```

```js
/**
 * Start (or restart) a benchmark session.
 * 
 * Tick-step constraints:
 * - bench_point_A >= 0
 * - bench_point_B - bench_point_A >= 2
 * 
 * Heavy mode:
 * - `work_quota` is the fixed amount of A-work (calls) done before measuring the remainder.
 * 
 * @param {number} [bench_point_A = 2] - Tick-step where the A benchmark runs.
 * @param {number} [bench_point_B = 6] - Tick-step where the B benchmark runs.
 * @param {number} [work_quota = 1] - Heavy-mode work calls (minimum 1).
 */
start(bench_point_A, bench_point_B, work_quota)
```

```js
/**
 * Pause sampling (puts the tick runner into an idle state).
 * 
 * Notes:
 * - Keeps `samples_A/samples_B` intact.
 * - Can be useful before running analysis.
 */
pause()
```

```js
/**
 * Resume sampling after `pause()`.
 */
resume()
```

```js
/**
 * Get last sample info for A and B.
 * 
 * @param {boolean} [raw_data = false]
 *   - `false` -> formatted string
 *   - `true` -> `[tick_step, runs_A, last_sample_A, runs_B, last_sample_B]`
 * @returns {string | number[]}
 */
last_samples(raw_data)
```

```js
/**
 * Get the current internal tick-step.
 * 
 * Notes:
 * - Useful for custom tooling that depends on bench points.
 * 
 * @returns {number}
 */
current_step()
```

```js
/**
 * Enqueue light-mode analysis.
 * 
 * Measures how many `(function call + empty eval)` iterations fit into the full runtime budget.
 * 
 * @param {number} [mad_multiplier = 3] - MAD multiplier for cutoffs.
 * @param {LightStats|Object|null} [output = null] - Object to fill with results.
 * @param {boolean} [show_logs = true]  - Broadcast the formatted results.
 */
analyze_light(mad_multiplier, output, show_logs)
```

```js
/**
 * Enqueue heavy-mode analysis.
 * 
 * Executes `func_A` exactly `work_quota` times (fixed work),
 * then measures the leftover budget via `func_B` iterations (remainder).
 * 
 * @param {number} [mad_multiplier = 3] - MAD multiplier for cutoffs.
 * @param {HeavyStats|Object|null} [output = null] - Object to fill with results.
 * @param {boolean} [show_logs = true]  - Broadcast the formatted results.
 */
analyze_heavy(mad_multiplier, output, show_logs)
```

```js
/**
 * Format helper for light analysis output.
 * 
 * @param {LightStats} stats
 * @returns {string}
 */
format_light(stats)
```

```js
/**
 * Format helper for heavy analysis output.
 * 
 * @param {HeavyStats} stats
 * @returns {string}
 */
format_heavy(stats)
```

```js
/**
 * Tick runner (light mode).
 * 
 * Notes:
 * - Collects samples.
 * - Executes queued analysis tasks.
 */
tick_light()
```

```js
/**
 * Tick runner (heavy mode).
 * 
 * Notes:
 * - Collects samples.
 * - Executes queued analysis tasks.
 */
tick_heavy()
```

</details>

---

<a id="workflow"></a>
<details open>
  <summary>
    <div align="center">
      <h2>❮ <code><b>☕ Workflow ☕</b></code> ❯</h2>
    </div>
  </summary>

```txt
setup -> start -> collect -> pause -> analyze -> resume -> (repeat)
```

  <div align="left">
    <h3>〔 <code><b>1</b></code> 〕 set the function</h3>
  </div>

```js
RT.func_A = () => {
  // code you want to measure
};
```

  <div align="left">
    <h3>〔 <code><b>2</b></code> 〕 start testing</h3>
  </div>

```js
RT.start(2, 6); // 8 ticks cycle

// other common configs:
// RT.start(3, 8); // 10 ticks cycle
// RT.start(1, 4); // 6 ticks cycle
// RT.start(0, 2); // 4 ticks cycle

// Note: faster cycle can trigger rate limiter more often.
```

  <div align="left">
    <h3>〔 <code><b>3</b></code> 〕 collect samples</h3>
  </div>

```js
// optional live check
RT.last_samples(false);
```

  <div align="left">
    <h3>〔 <code><b>4</b></code> 〕 stop testing</h3>
  </div>

```js
RT.pause();
```

  <div align="left">
    <h3>〔 <code><b>5</b></code> 〕 analyze samples</h3>
  </div>

```js
RT.analyze_light(3, null, true);
// RT.analyze_heavy(3, null, true);
```

  <div align="left">
    <h3>〔 <code><b>6</b></code> 〕 continue testing</h3>
  </div>

```js
RT.resume();
```

</details>

---

<a id="analysis"></a>
<details open>
  <summary>
    <div align="center">
      <h2>❮ <code><b>📊 Analysis 📊</b></code> ❯</h2>
    </div>
  </summary>

  <div align="left">
    <h3>〔 <code><b>Runtime Model</b></code> 〕</h3>
  </div>

  <div align="left">
    <h4>⊂ <code><b>Interruptions & Rate Limiter</b></code> ⊃</h4>
  </div>

  <p>
    Conceptually, the engine tracks the amount of work done and interrupts the callback call when it exceeds a limit.
    Internal condition looks like:
  </p>

```js
if (interruption_count % 5000 === 0 && runtime_count > MAX_RUNTIME_ALLOWED) {
  interrupt();
}
```

  <ul>
    <li>
      <code>interruption_count</code> is not a direct clock: changing how fast it increments (<code>IU</code> of the code snippet) typically does not change interruption frequency.<br>
      In practice, interruptions are dominated by the real runtime cost of executed code.
    </li>
    <li>
      Empirically, both counters are reset per callback invocation, but the effective rate limiter behaves accumulative across callbacks calls.
    </li>
  </ul>

  <div align="left">
    <h4>⊂ <code><b>TU origin</b></code> ⊃</h4>
  </div>

  <p>
    Early research in bloxd community (conducted by the <code>B-COP</code> group — Friday, October 31, 2025) standardized <code>TU</code> using a minimal tight loop (with global counter).<br>
    By convention, <code>1 TU</code> corresponds to one iteration of the following:
  </p>

```js
globalThis.iteration_count = 0;
while (true) { iteration_count++; }
```

  <p>
    In a lobby with only one player, the baseline is typically on the order of <code>~80000 iterations</code> per tick, which corresponds to a runtime budget of roughly <code>~80000 TU</code> (this is a commonly used reference point, not a fixed constant).
  </p>

  <p>
    The absolute value of the runtime budget is not stable (depends on servers load, network, other callbacks, QuickJS behavior).<br>
    <code>TU</code> is therefore most reliable for <ins>relative</ins> comparisons made under similar conditions.
  </p>

  <div align="left">
    <h4>⊂ <code><b>Tool Measurements</b></code> ⊃</h4>
  </div>

  <p>
    This tester does not rely on the raw TU reference loop directly.<br>
    It benchmarks using the following loop body instead:
  </p>

```js
_func_X(); // A or B
_eval();   // resets interruption counter and forces runtime check (interrupts if the limit is exceeded)
```

  <p>
    The baseline function <code>func_B</code> (defaults to no-op) is used for calibration.<br>
    One baseline iteration is defined as <code>4 TU</code>, so:
  </p>

```txt
TU_scale = 4 * median(iterations_B)
```

  <p>
    With a normalized baseline around <code>~20000 iterations</code> per tick callback call, this maps to a typical <code>~80000 TU</code> runtime budget (<code>20000 * 4</code>).<br>
  </p>

  <div align="left">
    <h3>〔 <code><b>Statistics</b></code> 〕</h3>
  </div>

  <p>
    Raw iteration samples contain jitter and occasional spikes. The tester uses robust filtering:
  </p>

  <ol>
    <li>Sort samples.</li>
    <li>Compute median.</li>
    <li>Compute <code>MAD = median(|x - median|)</code>.</li>
    <li>Keep only <code>[median - k * MAD .. median + k * MAD]</code> (<code>k = mad_multiplier</code>).</li>
    <li>Report filtered mean/median and the number of samples used.</li>
  </ol>

  <div align="left">
    <h3>〔 <code><b>Baseline Quality</b></code> 〕</h3>
  </div>

  <blockquote>
    <h4><code><b>! IMPORTANT</b></code></h4>
    <ul>
      <li>"Perfect" baseline is typically near <code>~20000 iterations</code> per tick.</li>
      <li>Practical "good" range is <code>~18000–22000</code>.</li>
      <li>Values far outside this range can noticeably skew results and reduce comparability across sessions.</li>
    </ul>
  </blockquote>

  <p>
    If baseline jitter/drift is high, TU results will jitter/drift too, even if <code>func_A</code> is perfectly stable.
  </p>

  <p><code><b>What To Watch</b></code></p>
  <ul>
    <li><code>median(iterations_B)</code> should stay close your "normal" value for the current session (after joining the lobby).</li>
    <li>The best normalized "noise" metric is <code>mad(iterations_B) / median(iterations_B)</code>.</li>
    <li>Filtering should keep most samples — <code>used / runs</code> should remain high.</li>
  </ul>

  <p><code><b>Practical Thresholds</b></code></p>
  <ul>
    <li>
      <code>Very good:</code> <code>mad/median ≤ ~2%</code>
      <span>(often ~300–450 MAD when baseline median is ~20k)</span>
    </li>
    <li>
      <code>Good:</code> <code>mad/median ≤ ~3%</code>
      <span>(often ~500–600 MAD when baseline median is ~20k)</span>
    </li>
    <li>
      <code>Noisy:</code> <code>mad/median > ~4%</code>
      <span>(expect noticeable TU drift; prefer a cleaner session)</span>
    </li>
  </ul>

  <div align="left">
    <h3>〔 <code><b>Runs & Accuracy</b></code> 〕</h3>
  </div>

  <p>
    The number of raw samples collected (tests made so far) is <code>runs</code>.<br>
    After MAD filtering, only <code>used</code> samples remain.<br>
    Accuracy is primarily determined by <code>used</code>, not by <code>runs</code>.
  </p>

  <p>
    Random noise shrinks roughly like <code>1 / sqrt(used)</code> (diminishing returns).
  </p>

  <p><code><b>Test Targets</b></code></p>
  <ul>
    <li><code>Quick check:</code> ~<code>50+</code> runs (aim for <code>used ≥ 30</code>).</li>
    <li><code>Accurate:</code> ~<code>150+</code> runs (aim for <code>used ≥ 100</code>).</li>
    <li><code>Very accurate:</code> ~<code>250+</code> runs (aim for <code>used ≥ 180</code>).</li>
  </ul>

  <p><code><b>Samples Quality</b></code></p>
  <ul>
    <li><b>Very good:</b> <code>used/runs ≥ ~85%</code></li>
    <li><b>Good:</b> <code>used/runs ≥ ~75%</code></li>
    <li><b>Jittery:</b> <code>used/runs < ~60%</code> (spikes/drift/other code; re-run in a cleaner session)</li>
  </ul>

  <blockquote>
    <h4><code><b>! TIP</b></code></h4>
    If you keep adding runs but <code>used</code> grows slowly (or baseline stats worsen), you're limited by environment noise, not by sample count.<br>
    In that case, re-running in a cleaner session usually helps more than collecting hundreds of additional runs.
  </blockquote>

  <div align="left">
    <h3>〔 <code><b>Additivity & Batching</b></code> 〕</h3>
  </div>

  <p>
    TU is approximately additive when the test setup is the same (same wrapper code, same call pattern):
  </p>

```txt
TU(X) + TU(Y) ≈ TU(X + Y)
```

  <p>
    Each benchmark iteration always includes a fixed internal overhead (<code>function call + empty eval</code>).<br>
    To estimate the net cost, subtract baseline TU once and then normalize by batch size.<br>
    If <code>func_A</code> repeats the same operation (set of operations) <code>N</code> times per call:
  </p>

```txt
TU_operation ≈ (TU_median(N) - 4) / N
```

  <p> More generally (for <ins>any test</ins>, including <code>N = 1</code>), subtract the baseline once: </p>

```txt
// cost of your real code (test function body)
TU_net ≈ TU_median - 4
```

  <div align="left">
    <h3>〔 <code><b>Mode Choice</b></code> 〕</h3>
  </div>

  <p>
    The best indicator is <code>median(iterations_A)</code> reported by analysis.<br>
    In light mode, low <code>iterations_A</code> makes TU sensitive to iteration jitter, so the estimate becomes noisy.
  </p>

  <div align="left">
    <h4>⊂ <code><b>Light Mode ("fast" code)</b></code> ⊃</h4>
  </div>
  <ul>
    <li><b>Recommended:</b> <code>median(iterations_A) ≥ ~150</code></li>
    <li><b>Borderline:</b> <code>~100–150</code> (usable, but expect higher TU spread)</li>
    <li><b>Switch to Heavy:</b> <code>&lt; ~100</code></li>
    <li><b>Avoid Light:</b> <code>&lt; ~80</code> (typically very jitter-sensitive)</li>
  </ul>

  <div align="left">
    <h4>⊂ <code><b>Heavy Mode ("slow" code)</b></code> ⊃</h4>
  </div>
  <ul>
    <li>Designed for low-iteration cases, BUT <ins>can be used for ANY setup.</ins></li>
    <li>Keep <code>func_B</code> as no-op for a clean baseline.</li>
    <li>The key parameter is <code>work_quota</code> (how much work you spend before measuring remainder).</li>
  </ul>

  <div align="left">
    <h4>⊂ <code><b>work_quota</b></code> ⊃</h4>
  </div>

  <p><code>Best Workflow</code></p>
  <ul>
    <li>
      <b>Step 1</b> — calibrate iterations
      <ul>
        <li>Run a short light-mode test with the same function body.</li>
        <li>Read <code>median(iterations_A)</code> from the results.</li>
      </ul>
    </li>
    <li>
      <b>Step 2</b> — choose <code>work_quota</code>
      <ul>
        <li><b>Default:</b> <code>work_quota ≈ round(0.33 * median(iterations_A)_light)</code></li>
        <li><b>Good range:</b> <code>~0.25–0.45 * median(iterations_A)_light</code></li>
      </ul>
    </li>
  </ul>

  <p><code>Heavy Mode Target Iterations</code></p>
  <ul>
    <li><code>median(remainder) ≈ 55%–75%</code> of <code>median(baseline)</code></li>
    <li>(equivalently, consumed ≈ <code>25%–45%</code> of baseline)</li>
  </ul>

  <p><code>Recommendations</code></p>
  <ul>
    <li>If remainder is too high (close to baseline) — increase <code>work_quota</code>.</li>
    <li>If remainder is too low (tiny) — decrease it (or reduce batching).</li>
  </ul>

</details>

---

<a id="output-format"></a>
<details open>
  <summary>
    <div align="center">
      <h2>❮ <code><b>🎯 Output Format 🎯</b></code> ❯</h2>
    </div>
  </summary>

  <p>
    An <code>output</code> object passed to <code>analyze_light</code> / <code>analyze_heavy</code> will be filled with analysis results.
  </p>

  <div align="left">
    <h3>〔 <code><b>Distribution</b></code> 〕</h3>
  </div>

```ts
type Distribution = {
  mean: number;      // mean over the filtered
  median: number;    // median over the filtered
  used: number;      // amount of samples used after filtering (MAD cutoffs)
  mad: number;       // median absolute deviation (computed on raw median)
  lower: number;     // lower cutoff = raw_median - k * MAD
  upper: number;     // upper cutoff = raw_median + k * MAD

  sorted: number[];  // sorted sample array (reference)
  start: number;     // start index of the kept range (inclusive)
  end: number;       // end index of the kept range (inclusive)
};
```

  <div align="left">
    <h3>〔 <code><b>Light mode</b></code> 〕</h3>
  </div>

```ts
type LightStats = {
  runs_B: number;
  consumed_iterations_B: Distribution;

  runs_A: number;
  consumed_iterations_A: Distribution;
  consumed_runtime_A: Distribution;
};
```

  <div align="left">
    <h3>〔 <code><b>Heavy mode</b></code> 〕</h3>
  </div>

```ts
type HeavyStats = {
  runs_B: number;
  consumed_iterations_B: Distribution;

  runs_A: number;
  remainder_iterations_A: Distribution;

  work_quota: number;
  consumed_iterations_A: Distribution;    // consumed = baseline - remainder

  equivalent_iterations_A: Distribution;  // light-mode equivalent iterations
  equivalent_runtime_A: Distribution;
};
```

  <blockquote>
    <h4><code><b>! NOTE</b></code></h4>
    <code>samples_A</code> / <code>samples_B</code> are sorted in-place by analysis calls. Clone them first if you need the original order.
  </blockquote>

</details>

---

<a id="license-and-credits"></a>
<details open>
  <summary>
    <div align="center">
      <h2>❮ <code><b>👥 License & Credits 👥</b></code> ❯</h2>
    </div>
  </summary>

```js
// Runtime Tester v2026-02-24-0001
// Copyright (c) 2026 delfineonx, TenderGalaxy
// SPDX-License-Identifier: Apache-2.0
```

</details>

---
