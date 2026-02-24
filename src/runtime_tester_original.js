// Runtime Tester v2026-02-24-0001
// Copyright (c) 2026 delfineonx, TenderGalaxy
// SPDX-License-Identifier: Apache-2.0

{
  const _RT = {
    styles: [
      "#FF775E", "500", "0.95rem", // error
      "#FFC23D", "500", "0.95rem", // warning
      "#20DD69", "500", "0.95rem", // success
      "#52B2FF", "500", "0.95rem"  // info
    ],

    set func_A(fn) { _func_A = fn; },
    get func_A() { return _func_A; },

    set func_B(fn) { _func_B = fn; },
    get func_B() { return _func_B; },

    samples_A: null,
    samples_B: null,

    init: null,

    start: null,
    pause: null,
    resume: null,
    last_samples: null,
    current_step: null,

    analyze_light: null,
    analyze_heavy: null,
    format_light: null,
    format_heavy: null,

    tick_light: null,
    tick_heavy: null,
  };

  // ----------------------------------------------------------------

  const _eval = eval;
  const _INFINITY = 1000000;

  // tick phase counter
  let _tick_step = 0.5;

  // running: (% 1 === 0)
  // idle:    (% 1 !== 0)
  let _base_step = 0;

  // bench and data save points (phases)
  let _bench_step_A = 0;
  let _save_step_A = 1;
  let _bench_step_B = 2;
  let _save_step_B = 3;
  // bench_A >= 0
  // bench_B - bench_A >= 2
  // interval_A = bench_A + 1
  // interval_B = bench_B - bench_A - 1

  // heavy mode function calls
  let _work_quota = 1;

  // runtime test counter
  let _iteration_count = 0;

  // test function stats
  let _func_A = () => { };
  let _runs_A = 0;
  let _last_sample_A = 0;
  const _iteration_samples_A = _RT.samples_A = [];

  // baseline function stats
  let _func_B = () => { };
  let _runs_B = 0;
  let _last_sample_B = 0;
  const _iteration_samples_B = _RT.samples_B = [];

  // ----------------------------------------------------------------

  const _task_queue = [];
  let _task_index = 0;
  let _task_phase_1 = 1;
  let _task_phase_2 = 1;

  // ----------------------------------------------------------------

  const _LOG_STYLES = [];

  // ----------------------------------------------------------------

  const _log = (message, type) => {
    const styledText = _LOG_STYLES[type];
    styledText[0].str = message;
    api.broadcastMessage(styledText);
    styledText[0].str = "";
  };

  const _process_queue = () => {
    let is_queue_active = _task_index < _task_queue.length;
    while (is_queue_active) {
      try {
        if (!_task_queue[_task_index]()) { break; }
      } catch (error) {
        _task_phase_1 = _task_phase_2 = 1;
        _log("Runtime Tester: Analysis error - " + error.name + ": " + error.message, 0);
      }
      is_queue_active = ++_task_index < _task_queue.length;
    }
    if (!is_queue_active) {
      _task_queue.length = 0;
      _task_index = 0;
    }
  };

  // ----------------------------------------------------------------

  {
    const _baseline_tu_per_iteration = 4;
    let _tu_scale = 80000; // ~ TU budget

    let _index;

    let _samples_count;
    let _raw_median;
    let _abs_deviations;
    let _median_abs_deviation;
    let _lower_cutoff;
    let _upper_cutoff;
    let _start_index;
    let _end_index;
    let _samples_used;
    let _filtered_sum;

    let _consumed_iteration_samples_A;
    let _consumed_runtime_samples_A;
    let _equivalent_iteration_samples_A;
    let _equivalent_runtime_samples_A;

    let _consumed_iterations_B;
    let _remainder_iterations_A;
    let _consumed_iterations_A;
    let _consumed_runtime_A;
    let _equivalent_iterations_A;
    let _equivalent_runtime_A;

    const _median_of_range = (sorted_samples, start_index, end_index) => {
      const samples_used = end_index - start_index + 1;
      const mid = start_index + (samples_used >> 1);
      return (samples_used & 1)
        ? sorted_samples[mid]
        : (sorted_samples[mid - 1] + sorted_samples[mid]) * 0.5;
    };

    const _compute_distribution = (samples, mad_multiplier, is_sorted) => {
      if (_task_phase_2 === 1) {
        _samples_count = samples.length;

        if (!_samples_count) {
          _task_phase_2 = 1;

          return {
            mean: 0,
            median: 0,
            used: 0,
            mad: 0,
            lower: 0,
            upper: 0,
            sorted: samples,
            start: 0,
            end: -1,
          };
        }

        if (!is_sorted) {
          // ascending
          samples.sort((a, b) => a - b);
        }

        _raw_median = _median_of_range(samples, 0, _samples_count - 1);

        _abs_deviations = [];
        _index = 0;
        _task_phase_2 = 2;
      }
      
      if (_task_phase_2 === 2) {
        // MAD = median(|x - median|)
        let diff;
        while (_index < _samples_count) {
          diff = samples[_index] - _raw_median;
          _abs_deviations[_index] = diff < 0 ? -diff : diff;
          _index++;
        }
        _abs_deviations.sort((a, b) => a - b);

        _median_abs_deviation = _median_of_range(_abs_deviations, 0, _samples_count - 1) || 1;

        _lower_cutoff = _raw_median - mad_multiplier * _median_abs_deviation;
        _upper_cutoff = _raw_median + mad_multiplier * _median_abs_deviation;

        _abs_deviations = null;

        _start_index = 0;
        _end_index = _samples_count - 1;
        _task_phase_2 = 3;
      }
      
      if (_task_phase_2 === 3) {
        while (_start_index <= _end_index && samples[_start_index] < _lower_cutoff) { _start_index++; }
        while (_end_index >= _start_index && samples[_end_index] > _upper_cutoff) { _end_index--; }
        _samples_used = _end_index - _start_index + 1;
        if (_samples_used <= 0) {
          _start_index = 0;
          _end_index = _samples_count - 1;
          _samples_used = _samples_count;
        }

        _filtered_sum = 0;
        _index = _start_index;
        _task_phase_2 = 4;
      }

      if (_task_phase_2 === 4) {
        while (_index <= _end_index) {
          _filtered_sum += samples[_index];
          _index++;
        }

        const filtered_mean = _filtered_sum / _samples_used;
        const filtered_median = _median_of_range(samples, _start_index, _end_index);

        _task_phase_2 = 1;

        return {
          mean: filtered_mean,
          median: filtered_median,
          used: _samples_used,
          mad: _median_abs_deviation,
          lower: _lower_cutoff,
          upper: _upper_cutoff,
          sorted: samples,
          start: _start_index,
          end: _end_index,
        };
      }
    };

    const _make_runtime_samples = (distribution, output) => {
      if (_task_phase_2 === 1) {
        _start_index = distribution.start;
        _end_index = distribution.end;
        _index = 0;
        _task_phase_2 = 2;
      }

      if (_task_phase_2 === 2) {
        const sorted_samples = distribution.sorted;
        // ascending
        while (_end_index >= _start_index) {
          output[_index] = _tu_scale / (sorted_samples[_end_index] || 1);
          _index++;
          _end_index--;
        }

        _task_phase_2 = 1;
      }
    };

    const _format_block = (distribution, precision, name) => {
      const factor = 10 ** precision;
      const round = (num) => Math.round(num * factor) / factor;
      return (
        "\n  " + name + " mean = " + round(distribution.mean) + " | median = " + round(distribution.median) + " | used = " + distribution.used +
        "\n  mad = " + round(distribution.mad) + " | range = [" + round(distribution.lower) + " .. " + round(distribution.upper) + "]"
      );
    };

    const _format_light = _RT.format_light = (stats) => {
      return (
        "[ consumed B ] (runs = " + stats.runs_B + ")" +
        _format_block(stats.consumed_iterations_B, 2, "iters") +
        "\n[ consumed A ] (runs = " + stats.runs_A + ")" +
        _format_block(stats.consumed_iterations_A, 4, "iters") +
        _format_block(stats.consumed_runtime_A, 4, "TU")
      );
    };

    const _format_heavy = _RT.format_heavy = (stats) => {
      return (
        "[ consumed B ] (runs = " + stats.runs_B + ")" +
        _format_block(stats.consumed_iterations_B, 2, "iters") +
        "\n[ remainder A ] (runs = " + stats.runs_A + ")" +
        _format_block(stats.remainder_iterations_A, 2, "iters") +
        "\n[ consumed A ] (work = " + stats.work_quota + ")" +
        _format_block(stats.consumed_iterations_A, 2, "iters") +
        "\n[ equivalent A ]" +
        _format_block(stats.equivalent_iterations_A, 4, "iters") +
        _format_block(stats.equivalent_runtime_A, 4, "TU")
      );
    };

    // ----------------------------------------------------------------

    const _light_analysis_task = (mad_multiplier, output, show_result) => {
      if (_task_phase_1 === 1) {
        _consumed_iterations_B = _compute_distribution(_iteration_samples_B, mad_multiplier, false);
        _tu_scale = (_consumed_iterations_B.median || 1) * _baseline_tu_per_iteration;
        _task_phase_1 = 2;
      }
      if (_task_phase_1 === 2) {
        _consumed_iterations_A = _compute_distribution(_iteration_samples_A, mad_multiplier, false);
        _consumed_runtime_samples_A = [];
        _task_phase_1 = 3;
      }

      if (_task_phase_1 === 3) {
        _make_runtime_samples(_consumed_iterations_A, _consumed_runtime_samples_A);
        _task_phase_1 = 4;
      }

      if (_task_phase_1 === 4) {
        _consumed_runtime_A = _compute_distribution(_consumed_runtime_samples_A, mad_multiplier, true);
        _task_phase_1 = 5;
      }

      if (_task_phase_1 === 5) {
        if (output == null) {
          output = {};
        }
        output.runs_B = _runs_B;
        output.consumed_iterations_B = _consumed_iterations_B;
        output.runs_A = _runs_A;
        output.consumed_iterations_A = _consumed_iterations_A;
        output.consumed_runtime_A = _consumed_runtime_A;

        if (show_result) {
          _log(_format_light(output), 3);
        }

        _consumed_iterations_B = null;
        _consumed_iterations_A = null;
        _consumed_runtime_samples_A = null;
        _consumed_runtime_A = null;

        _task_phase_1 = 1;
        return true;
      }
    };

    const _heavy_analysis_task = (mad_multiplier, output, show_result) => {
      if (_task_phase_1 === 1) {
        _consumed_iterations_B = _compute_distribution(_iteration_samples_B, mad_multiplier, false);
        _tu_scale = (_consumed_iterations_B.median || 1) * _baseline_tu_per_iteration;
        _task_phase_1 = 2;
      }
      if (_task_phase_1 === 2) {
        _remainder_iterations_A = _compute_distribution(_iteration_samples_A, mad_multiplier, false);
        _task_phase_1 = 3;
      }

      if (_task_phase_1 === 3) {
        _consumed_iteration_samples_A = [];
        _equivalent_iteration_samples_A = [];
        
        _start_index = _remainder_iterations_A.start;
        _end_index = _remainder_iterations_A.end;
        _index = 0;
        _task_phase_1 = 4;
      }
      
      if (_task_phase_1 === 4) {
        const sorted_samples_A = _remainder_iterations_A.sorted;
        const baseline_iterations = _consumed_iterations_B.median || 1;
        
        let consumed;
        while (_start_index <= _end_index) {
          consumed = baseline_iterations - sorted_samples_A[_start_index];
          if (consumed > 0) {
            _consumed_iteration_samples_A[_index] = consumed;
            _equivalent_iteration_samples_A[_index] = (baseline_iterations * _work_quota) / consumed;
            _index++;
          }
          _start_index++;
        }
        
        _task_phase_1 = 5;
      }

      if (_task_phase_1 === 5) {
        _consumed_iterations_A = _compute_distribution(_consumed_iteration_samples_A, mad_multiplier, false);
        _task_phase_1 = 6;
      }
      
      if (_task_phase_1 === 6) {
        _equivalent_iterations_A = _compute_distribution(_equivalent_iteration_samples_A, mad_multiplier, false);
        _equivalent_runtime_samples_A = [];
        _task_phase_1 = 7;
      }

      if (_task_phase_1 === 7) {
        _make_runtime_samples(_equivalent_iterations_A, _equivalent_runtime_samples_A);
        _task_phase_1 = 8;
      }

      if (_task_phase_1 === 8) {
        _equivalent_runtime_A = _compute_distribution(_equivalent_runtime_samples_A, mad_multiplier, true);
        _task_phase_1 = 9;
      }

      if (_task_phase_1 === 9) {
        if (output == null) {
          output = {};
        }
        output.runs_B = _runs_B;
        output.consumed_iterations_B = _consumed_iterations_B;
        output.runs_A = _runs_A;
        output.remainder_iterations_A = _remainder_iterations_A;
        output.work_quota = _work_quota;
        output.consumed_iterations_A = _consumed_iterations_A;
        output.equivalent_iterations_A = _equivalent_iterations_A;
        output.equivalent_runtime_A = _equivalent_runtime_A;

        if (show_result) {
          _log(_format_heavy(output), 3);
        }

        _consumed_iterations_B = null;
        _remainder_iterations_A = null;
        _consumed_iteration_samples_A = null;
        _equivalent_iteration_samples_A = null;
        _consumed_iterations_A = null;
        _equivalent_iterations_A = null;
        _equivalent_runtime_samples_A = null;
        _equivalent_runtime_A = null;

        _task_phase_1 = 1;
        return true;
      }
    };

    _RT.analyze_light = (mad_multiplier = 3, output = null, show_result = true) => {
      _task_queue[_task_queue.length] = () => _light_analysis_task(mad_multiplier, output, show_result);
    };

    _RT.analyze_heavy = (mad_multiplier = 3, output = null, show_result = true) => {
      _task_queue[_task_queue.length] = () => _heavy_analysis_task(mad_multiplier, output, show_result);
    };

    // ----------------------------------------------------------------

    _RT.init = () => {
      const styles = _RT.styles;
      for (let type = 0; type < 4; type++) {
        _LOG_STYLES[type] = [{
          str: "",
          style: {
            color: styles[type * 3],
            fontWeight: styles[type * 3 + 1],
            fontSize: styles[type * 3 + 2],
          }
        }];
      }
    };

    _RT.start = (bench_point_A = 2, bench_point_B = 6, work_quota = 1) => {
      _save_step_A = 1 + (_bench_step_A = bench_point_A | 0);
      _save_step_B = 1 + (_bench_step_B = bench_point_B | 0);
      _work_quota = (work_quota | 0) || 1;

      _tick_step = -1;
      _base_step = 0;

      _iteration_count = 0;

      _runs_A = 0;
      _last_sample_A = 0;
      _iteration_samples_A.length = 0;

      _runs_B = 0;
      _last_sample_B = 0;
      _iteration_samples_B.length = 0;

      _task_queue.length = 0;
      _task_index = 0;
      _task_phase_1 = 1;
      _task_phase_2 = 1;

      _abs_deviations = null;

      _consumed_iteration_samples_A = null;
      _consumed_runtime_samples_A = null;
      _equivalent_iteration_samples_A = null;
      _equivalent_runtime_samples_A = null;

      _consumed_iterations_B = null;
      _remainder_iterations_A = null;
      _consumed_iterations_A = null;
      _consumed_runtime_A = null;
      _equivalent_iterations_A = null;
      _equivalent_runtime_A = null;
    };

    _RT.pause = () => {
      _base_step = 0.5;
    };

    _RT.resume = () => {
      if (_tick_step !== (_tick_step | 0)) {
        _tick_step = -1;
        _base_step = 0;
      }
    };

    _RT.last_samples = (raw_data = false) => {
      if (raw_data) {
        return [_tick_step, _runs_A, _last_sample_A, _runs_B, _last_sample_B];
      }
      return (
        "[ last samples ] (step = " + _tick_step + ")" +
        "\n  runs_A = " + _runs_A + " | sample_A = " + _last_sample_A +
        "\n  runs_B = " + _runs_B + " | sample_B = " + _last_sample_B
      );
    };

    _RT.current_step = () => {
      return _tick_step;
    };
  }

  // ----------------------------------------------------------------

  _RT.tick_light = () => {
    _eval();
    if (_tick_step === _bench_step_A) {
      _tick_step++;
      _iteration_count = 0;
      while (_iteration_count < _INFINITY) {
        _func_A();
        _eval();
        _iteration_count++;
      }
    }
    if (_tick_step === _bench_step_B) {
      _tick_step++;
      _iteration_count = 0;
      while (_iteration_count < _INFINITY) {
        _func_B();
        _eval();
        _iteration_count++;
      }
    }
    if (_tick_step === _save_step_A) {
      _iteration_samples_A[_runs_A] = _last_sample_A = _iteration_count;
      _runs_A++;
      _tick_step++;
      return;
    }
    if (_tick_step === _save_step_B) {
      _iteration_samples_B[_runs_B] = _last_sample_B = _iteration_count;
      _runs_B++;
      _tick_step = _base_step;
      return;
    }
    _tick_step++;
    if (_task_queue.length) {
      _process_queue();
    }
  };

  _RT.tick_heavy = () => {
    _eval();
    if (_tick_step === _bench_step_A) {
      _tick_step++;
      _iteration_count = 0;
      while (_iteration_count < _work_quota) {
        _func_A();
        _eval();
        _iteration_count++;
      }
      _iteration_count = 0;
      while (_iteration_count < _INFINITY) {
        _func_B();
        _eval();
        _iteration_count++;
      }
    }
    if (_tick_step === _bench_step_B) {
      _tick_step++;
      _iteration_count = 0;
      while (_iteration_count < _work_quota) {
        _func_B();
        _eval();
        _iteration_count++;
      }
      while (_iteration_count < _INFINITY) {
        _func_B();
        _eval();
        _iteration_count++;
      }
    }
    if (_tick_step === _save_step_A) {
      _iteration_samples_A[_runs_A] = _last_sample_A = _iteration_count;
      _runs_A++;
      _tick_step++;
      return;
    }
    if (_tick_step === _save_step_B) {
      _iteration_samples_B[_runs_B] = _last_sample_B = _iteration_count;
      _runs_B++;
      _tick_step = _base_step;
      return;
    }
    _tick_step++;
    if (_task_queue.length) {
      _process_queue();
    }
  };

  // ----------------------------------------------------------------

  _RT.init();

  globalThis.RT = _RT;

  void 0;
}

