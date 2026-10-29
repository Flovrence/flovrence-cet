/* ============================================================
 * 语音模块：TTS（考官说话）+ STT（考生说话）
 * 兼容：Edge / Chrome / Safari(iOS, webkit前缀) / 安卓自带浏览器
 * 使用系统自带语音能力，离线可用，不上传任何音频。
 * ============================================================ */
window.CET_VOICE = (function () {

  /* ---------------- TTS：让考官开口说话 ---------------- */
  let cachedVoices = [];
  let currentUtterance = null;

  function loadVoices() {
    try {
      cachedVoices = window.speechSynthesis ? speechSynthesis.getVoices() : [];
    } catch (e) { cachedVoices = []; }
    return cachedVoices;
  }
  if (window.speechSynthesis) {
    loadVoices();
    speechSynthesis.onvoiceschanged = function () { loadVoices(); };
  }

  function pickEnglishVoice(prefer) {
    const vs = loadVoices() || [];
    if (!vs.length) return null;
    const prefs = prefer === 'en-GB'
      ? ['en-GB', 'en-UK', 'en-AU']
      : ['en-US', 'en-GB', 'en-AU', 'en'];
    // 优先自然音色排名靠前的
    const rank = ['Google US English', 'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)', 'Samantha', 'Microsoft Guy Online (Natural) - English (United States)', 'Google UK English Female', 'Google UK English Male'];
    let best = null, bestScore = -1;
    for (const v of vs) {
      const langOk = prefs.some((p) => (v.lang || '').toLowerCase().startsWith(p.toLowerCase()));
      if (!langOk) continue;
      let score = 0;
      for (let i = 0; i < rank.length; i++) if ((v.name || '').indexOf(rank[i]) >= 0) score += (rank.length - i) * 10;
      score += (v.localService ? 1 : 0);
      if (score > bestScore) { bestScore = score; best = v; }
    }
    if (!best) {
      // 只要 lang 以 en 开头
      best = vs.find((v) => (v.lang || '').toLowerCase().startsWith('en')) || null;
    }
    return best;
  }

  /** speak(text, {rate, pitch, voice, onend}) -> Promise */
  function speak(text, opts) {
    opts = opts || {};
    if (!window.speechSynthesis) {
      if (opts.onend) opts.onend();
      return Promise.resolve(false);
    }
    return new Promise((resolve) => {
      try { speechSynthesis.cancel(); } catch (e) { /* ignore */ }
      const u = new SpeechSynthesisUtterance(text);
      u.rate = opts.rate || 1.0;
      u.pitch = opts.pitch || 1.0;
      u.volume = 1.0;
      u.lang = 'en-US';
      const v = pickEnglishVoice(opts.voice);
      if (v) { u.voice = v; u.lang = v.lang; }
      let done = false;
      const finish = (ok) => {
        if (done) return;
        done = true;
        if (opts.onend) opts.onend(ok);
        resolve(ok);
      };
      u.onstart = function () { if (opts.onstart) opts.onstart(); };
      u.onend = function () { finish(true); };
      u.onerror = function (e) {
        // 有些浏览器中断时也会抛 error，视为“被取消”
        if (e && e.error === 'interrupted') { finish(false); } else { finish(false); }
      };
      try {
        currentUtterance = u;
        speechSynthesis.speak(u);
      } catch (e) { finish(false); }
    });
  }

  function stopSpeaking() {
    try { if (window.speechSynthesis) speechSynthesis.cancel(); } catch (e) { /* ignore */ }
    currentUtterance = null;
  }

  function ttsAvailable() {
    return !!window.speechSynthesis;
  }

  /* ---------------- STT：识别考生说的话 ---------------- */
  function getSpeechRecognition() {
    const w = window;
    return w.SpeechRecognition || w.webkitSpeechRecognition || null;
  }

  function sttAvailable() {
    return !!getSpeechRecognition();
  }

  const STT_STATE = { listening: false, stopped: false };

  /**
   * listen({ lang, interim, onInterim, onFinal, onEnd, onError })
   * 返回 { stop() }
   */
  function listen(opts) {
    opts = opts || {};
    const SR = getSpeechRecognition();
    if (!SR) {
      if (opts.onError) opts.onError({ error: 'unsupported', message: '当前浏览器不支持语音识别，请改用文字输入（推荐 Edge/Chrome）' });
      return null;
    }
    let rec;
    try {
      rec = new SR();
    } catch (e) {
      if (opts.onError) opts.onError({ error: 'init', message: '语音识别初始化失败：' + e.message });
      return null;
    }
    rec.lang = opts.lang || 'en-US';
    rec.interimResults = true;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    let finalText = '';
    let timedOut = false;
    let noSpeechTimer = null;

    const clearTimer = () => { if (noSpeechTimer) { clearTimeout(noSpeechTimer); noSpeechTimer = null; } };

    // 若长时间无有效语音，自动结束避免一直转圈
    noSpeechTimer = setTimeout(function () { timedOut = true; try { rec.stop(); } catch (e) { /* ignore */ } }, opts.maxSilenceMs || 20000);

    rec.onresult = function (ev) {
      clearTimer();
      let interim = '';
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        if (r.isFinal) {
          finalText += (finalText ? ' ' : '') + (r[0] && r[0].transcript || '');
        } else {
          interim += (r[0] && r[0].transcript || '');
        }
      }
      if (interim && opts.onInterim) opts.onInterim(interim);
      if (finalText && opts.onInterim) opts.onInterim(finalText);
      if (opts.onFinalRaw && finalText) opts.onFinalRaw(finalText);
    };

    rec.onerror = function (ev) {
      clearTimer();
      let msg = '';
      switch (ev.error) {
        case 'no-speech': msg = '没有听到声音，请靠近麦克风再试一次'; break;
        case 'audio-capture': msg = '找不到麦克风或麦克风被占用'; break;
        case 'not-allowed': case 'service-not-allowed': msg = '麦克风权限被拒绝，请在浏览器地址栏允许麦克风'; break;
        case 'network': msg = '语音识别网络错误（在线识别需要联网）'; break;
        default: msg = '语音识别出错：' + ev.error;
      }
      if (opts.onError) opts.onError({ error: ev.error, message: msg });
    };

    rec.onend = function () {
      clearTimer();
      STT_STATE.listening = false;
      if (opts.onEnd) opts.onEnd({ final: finalText.trim(), stopped: STT_STATE.stopped || timedOut });
    };

    try {
      rec.start();
      STT_STATE.listening = true;
      STT_STATE.stopped = false;
    } catch (e) {
      if (opts.onError) opts.onError({ error: 'start', message: '语音识别启动失败：' + e.message });
      return null;
    }

    return {
      stop() {
        STT_STATE.stopped = true;
        clearTimer();
        try { rec.stop(); } catch (e) { /* ignore */ }
      },
      abort() {
        clearTimer();
        try { rec.abort(); } catch (e) { /* ignore */ }
      },
    };
  }

  function sttState() { return STT_STATE.listening; }

  /* ---------------- 语音能力检测（给前端提示用） ---------------- */
  function capabilityReport() {
    return {
      tts: ttsAvailable(),
      stt: sttAvailable(),
      engine: (function () {
        const ua = navigator.userAgent;
        if (ua.indexOf('Edg/') >= 0) return 'Edge';
        if (ua.indexOf('Safari') >= 0 && ua.indexOf('Chrome') < 0) return 'Safari';
        if (ua.indexOf('Chrome') >= 0) return 'Chrome';
        if (/android/i.test(ua)) return 'Android';
        return 'Unknown';
      })(),
      secure: (function () {
        try { return window.isSecureContext === true; } catch (e) { return location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1'; }
      })(),
    };
  }

  return {
    speak,
    stopSpeaking,
    listen,
    pickEnglishVoice,
    loadVoices,
    ttsAvailable,
    sttAvailable,
    sttState,
    capabilityReport,
  };
})();