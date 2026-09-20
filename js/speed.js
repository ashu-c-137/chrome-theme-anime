const DOWN = "https://speed.cloudflare.com/__down";
const UP = "https://speed.cloudflare.com/__up";

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (!sorted.length) {
    return NaN;
  }
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatMbps(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "—";
  }
  if (value >= 100) {
    return String(Math.round(value));
  }
  if (value >= 10) {
    return value.toFixed(1);
  }
  return value.toFixed(2);
}

function formatLiveMbps(value) {
  if (!Number.isFinite(value) || value <= 0) {
    return "";
  }
  if (value >= 100) {
    return String(Math.round(value));
  }
  return value.toFixed(1);
}

function mbps(bytes, elapsedMs) {
  const seconds = Math.max(elapsedMs / 1000, 0.12);
  return (bytes * 8) / seconds / 1e6;
}

function lerp(from, to, amount) {
  return from + (to - from) * amount;
}

async function measurePing(signal, onSample) {
  const rounds = 10;
  const samples = [];
  for (let i = 0; i < rounds + 1; i += 1) {
    const started = performance.now();
    const response = await fetch(`${DOWN}?bytes=0&r=${Math.random()}`, {
      cache: "no-store",
      signal,
    });
    if (!response.ok) {
      throw new Error("ping failed");
    }
    await response.arrayBuffer();
    const rtt = performance.now() - started;
    if (i === 0) {
      continue;
    }
    samples.push(rtt);
    onSample({
      instant: rtt,
      median: median(samples),
      t: samples.length / rounds,
    });
  }
  return median(samples);
}

function transferChunk(method, url, body, signal, onByte) {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open(method, url);
    if (method === "GET") {
      request.responseType = "arraybuffer";
    } else {
      request.setRequestHeader("Content-Type", "application/octet-stream");
    }
    const watch = method === "GET" ? request : request.upload;
    watch.onprogress = (event) => {
      onByte(event.loaded || 0);
    };
    request.onload = () => {
      if (method === "GET" && request.response instanceof ArrayBuffer) {
        onByte(request.response.byteLength);
      }
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`${method} failed`));
    };
    request.onerror = () => reject(new Error(`${method} failed`));
    request.onabort = () => reject(new DOMException("Aborted", "AbortError"));
    const abort = () => request.abort();
    if (signal.aborted) {
      abort();
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }
    signal.addEventListener("abort", abort, { once: true });
    request.send(body);
  });
}

async function measureDownload(signal, onProgress) {
  const started = performance.now();
  const limitMs = 7000;
  let loaded = 0;
  let lastLoaded = 0;
  let lastAt = started;

  function report(now = performance.now()) {
    if (now - lastAt < 32) {
      return;
    }
    onProgress({
      instant: mbps(loaded - lastLoaded, now - lastAt),
      average: mbps(loaded, now - started),
      t: Math.min(1, (now - started) / limitMs),
    });
    lastLoaded = loaded;
    lastAt = now;
  }

  async function worker() {
    while (performance.now() - started < limitMs) {
      try {
        let mark = 0;
        await transferChunk(
          "GET",
          `${DOWN}?bytes=8000000&r=${Math.random()}`,
          null,
          signal,
          (chunkLoaded) => {
            loaded += Math.max(0, chunkLoaded - mark);
            mark = chunkLoaded;
            report();
          }
        );
      } catch (error) {
        if (error?.name === "AbortError") {
          if (performance.now() - started >= limitMs - 40) {
            return;
          }
          throw error;
        }
        if (performance.now() - started >= limitMs) {
          break;
        }
        await new Promise((resolve) => {
          window.setTimeout(resolve, 160);
        });
      }
    }
  }

  await Promise.all([worker(), worker(), worker()]);
  const ended = performance.now();
  if (loaded > lastLoaded) {
    onProgress({
      instant: mbps(loaded - lastLoaded, Math.max(ended - lastAt, 16)),
      average: mbps(loaded, ended - started),
      t: Math.min(1, (ended - started) / limitMs),
    });
  }
  return mbps(loaded, Math.max(ended - started, 1));
}

async function measureUpload(signal, onProgress) {
  const started = performance.now();
  const limitMs = 6000;
  const payload = new Uint8Array(2 * 1024 * 1024);
  let sent = 0;
  let lastSent = 0;
  let lastAt = started;

  function tick() {
    const now = performance.now();
    if (now - lastAt < 32) {
      return;
    }
    onProgress({
      instant: mbps(sent - lastSent, now - lastAt),
      average: mbps(sent, now - started),
      t: Math.min(1, (now - started) / limitMs),
    });
    lastSent = sent;
    lastAt = now;
  }

  async function worker() {
    try {
      while (performance.now() - started < limitMs) {
        let mark = 0;
        await transferChunk("POST", UP, payload, signal, (chunkLoaded) => {
          sent += Math.max(0, chunkLoaded - mark);
          mark = chunkLoaded;
          tick();
        });
      }
    } catch (error) {
      if (error?.name === "AbortError") {
        if (performance.now() - started >= limitMs - 40) {
          return;
        }
        throw error;
      }
    }
  }

  await Promise.all([worker(), worker()]);
  const ended = performance.now();
  if (ended - lastAt > 16 && sent > lastSent) {
    onProgress({
      instant: mbps(sent - lastSent, ended - lastAt),
      average: mbps(sent, ended - started),
      t: Math.min(1, (ended - started) / limitMs),
    });
  }
  return mbps(sent, ended - started);
}

export function initSpeed() {
  const root = document.getElementById("speed-test");
  const kicker = document.getElementById("speed-kicker-text");
  const idle = document.getElementById("speed-idle");
  const downLine = document.getElementById("speed-line-down");
  const upLine = document.getElementById("speed-line-up");
  const pingLine = document.getElementById("speed-line-ping");
  const downFill = document.getElementById("speed-fill-down");
  const upFill = document.getElementById("speed-fill-up");
  const pingFill = document.getElementById("speed-fill-ping");
  const downTip = document.getElementById("speed-tip-down");
  const upTip = document.getElementById("speed-tip-up");
  const pingTip = document.getElementById("speed-tip-ping");
  const downEl = document.getElementById("speed-down");
  const upEl = document.getElementById("speed-up");
  const pingEl = document.getElementById("speed-ping");

  const chartWidth = 720;
  const chartHeight = 192;
  const pad = 10;
  const centerY = chartHeight / 2;
  const lines = {
    down: { path: downLine, fill: downFill, tip: downTip },
    up: { path: upLine, fill: upFill, tip: upTip },
    ping: { path: pingLine, fill: pingFill, tip: pingTip },
  };

  let running = false;
  let raf = 0;
  let live = null;

  function polylinePath(points) {
    if (!points.length) {
      return "";
    }
    let d = `M${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;
    for (let i = 1; i < points.length; i += 1) {
      d += `L${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
    }
    return d;
  }

  function areaPath(points) {
    if (points.length < 2) {
      return "";
    }
    const first = points[0];
    const last = points[points.length - 1];
    let d = `M${first.x.toFixed(2)} ${centerY.toFixed(2)}`;
    for (let i = 0; i < points.length; i += 1) {
      d += `L${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)}`;
    }
    d += `L${last.x.toFixed(2)} ${centerY.toFixed(2)}Z`;
    return d;
  }

  function needle(t, amp) {
    const swing =
      Math.sin(t * Math.PI * 2 * 26.4) * 0.4 +
      Math.sin(t * Math.PI * 2 * 43.1 + 0.8) * 0.27 +
      Math.sin(t * Math.PI * 2 * 11.2 + 1.4) * 0.2 +
      Math.sin(t * Math.PI * 2 * 67.8 + 0.3) * 0.13;
    return swing * amp;
  }

  function envelopeAt(samples, t) {
    if (!samples.length) {
      return 0;
    }
    if (t <= samples[0].t) {
      return samples[0].v;
    }
    const last = samples[samples.length - 1];
    if (t >= last.t) {
      return last.v;
    }
    let lo = 0;
    let hi = samples.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >> 1;
      if (samples[mid].t <= t) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    const a = samples[lo];
    const b = samples[hi];
    const span = Math.max(1e-6, b.t - a.t);
    return a.v + (b.v - a.v) * ((t - a.t) / span);
  }

  function buildWave(samples, tNow, max) {
    const span = Math.min(1, Math.max(0, tNow));
    const count = Math.max(2, Math.round(span * 340) + 1);
    const reach = chartHeight / 2 - pad;
    const width = chartWidth - pad * 2;
    const points = [];
    for (let i = 0; i < count; i += 1) {
      const t = (i / (count - 1)) * span;
      const amp = Math.min(1, Math.max(0, envelopeAt(samples, t) / Math.max(max, 1)));
      points.push({
        x: pad + t * width,
        y: centerY - needle(t, amp) * reach,
      });
    }
    return points;
  }

  function clearSeries(name) {
    const series = lines[name];
    series.path.setAttribute("d", "");
    series.fill.setAttribute("d", "");
    series.tip.classList.add("hidden");
  }

  function paintLive() {
    if (!live) {
      return;
    }
    const series = lines[live.active];
    const points = buildWave(live.points, live.drawT, live.drawMax);
    series.path.setAttribute("d", points.length > 1 ? polylinePath(points) : "");
    series.fill.setAttribute("d", areaPath(points));
    if (!points.length) {
      series.tip.classList.add("hidden");
      return;
    }
    const last = points[points.length - 1];
    series.tip.setAttribute("transform", `translate(${last.x.toFixed(2)} ${last.y.toFixed(2)})`);
    series.tip.classList.remove("hidden");
  }

  function setText(el, value) {
    if (el.textContent !== value) {
      el.textContent = value;
    }
  }

  function stopLive() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    live = null;
  }

  function frame(now) {
    if (!live) {
      return;
    }
    const clockT = live.limitMs
      ? Math.min(1, Math.max(0, (now - live.startedAt) / live.limitMs))
      : lerp(live.drawT, live.targetT, 0.14);
    live.drawT = clockT;
    live.ema = live.ema ? lerp(live.ema, live.targetV, 0.1) : live.targetV;
    live.drawV = lerp(live.drawV, live.ema, 0.22);
    live.drawAvg = lerp(live.drawAvg, live.targetAvg, 0.18);
    live.peak = Math.max(live.peak, live.drawV, live.targetV * 0.92);
    live.drawMax = lerp(live.drawMax, Math.max(live.peak * 1.12, 1), 0.07);

    const last = live.points[live.points.length - 1];
    if (!last || live.drawT > last.t) {
      live.points.push({ t: live.drawT, v: live.drawV });
    } else {
      last.v = live.drawV;
    }

    paintLive();
    setText(live.textEl, live.format(live.drawAvg));
    raf = requestAnimationFrame(frame);
  }

  function startLive({ active, textEl, format, limitMs }) {
    stopLive();
    Object.keys(lines).forEach(clearSeries);
    live = {
      active,
      textEl,
      format,
      limitMs: limitMs || 0,
      startedAt: performance.now(),
      points: [{ t: 0, v: 0 }],
      targetT: 0,
      targetV: 0,
      targetAvg: 0,
      ema: 0,
      drawT: 0,
      drawV: 0,
      drawAvg: 0,
      drawMax: 1,
      peak: 1,
    };
    root.classList.toggle("is-down", active === "down");
    root.classList.toggle("is-up", active === "up");
    root.classList.toggle("is-ping", active === "ping");
    raf = requestAnimationFrame(frame);
  }

  function pushTarget({ instant, average, t }) {
    if (!live) {
      return;
    }
    const value = Math.max(0, instant);
    live.targetV = live.targetV ? lerp(live.targetV, value, 0.35) : value;
    live.targetAvg = average;
    live.targetT = t;
  }

  function resetReadout() {
    stopLive();
    kicker.textContent = "Speed";
    idle.textContent = "Tap to test";
    Object.keys(lines).forEach(clearSeries);
    downEl.textContent = "";
    upEl.textContent = "";
    pingEl.textContent = "";
    root.classList.remove("is-running", "is-done", "is-down", "is-up", "is-ping");
    root.classList.add("is-idle");
  }

  async function run() {
    if (running) {
      return;
    }
    running = true;
    const controller = new AbortController();
    downEl.textContent = "";
    upEl.textContent = "";
    pingEl.textContent = "";
    Object.keys(lines).forEach(clearSeries);
    root.classList.remove("is-idle", "is-done");
    root.classList.add("is-running");
    try {
      kicker.textContent = "Down";
      startLive({
        active: "down",
        textEl: downEl,
        format: formatLiveMbps,
        limitMs: 7000,
      });
      const down = await measureDownload(controller.signal, pushTarget);
      stopLive();
      setText(downEl, formatMbps(down));

      kicker.textContent = "Up";
      startLive({
        active: "up",
        textEl: upEl,
        format: formatLiveMbps,
        limitMs: 6000,
      });
      const up = await measureUpload(controller.signal, pushTarget);
      stopLive();
      setText(upEl, formatMbps(up));

      kicker.textContent = "Ping";
      startLive({
        active: "ping",
        textEl: pingEl,
        format: (value) => (Number.isFinite(value) && value > 0 ? String(Math.round(value)) : ""),
      });
      const ping = await measurePing(controller.signal, ({ instant, median: pingMs, t }) => {
        pushTarget({ instant, average: pingMs, t });
      });
      stopLive();
      Object.keys(lines).forEach(clearSeries);
      setText(pingEl, Number.isFinite(ping) ? String(Math.round(ping)) : "—");
      kicker.textContent = "Speed";
      root.classList.remove("is-running", "is-down", "is-up", "is-ping");
      root.classList.add("is-done");
    } catch {
      resetReadout();
      idle.textContent = "Couldn't reach.";
    } finally {
      stopLive();
      running = false;
    }
  }

  root.addEventListener("click", run);

  return { run, isRunning: () => running };
}
