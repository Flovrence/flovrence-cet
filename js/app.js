/* ============================================================
 * 应用主逻辑：登录/注册、年份选择与倒计时、设置、历史成绩、
 * 面试界面 & 成绩单展示、听力导航
 * ============================================================ */
window.CET_APP = (function () {

  /* ---------------- 全局错误浮层：任何脚本错误都会显示出来 ---------------- */
  function showFatal(msg, stack) {
    try {
      let box = document.getElementById('fatal-box');
      if (!box) {
        box = document.createElement('div');
        box.id = 'fatal-box';
        box.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#ff3b30;color:#fff;padding:12px 16px;font-size:13px;font-family:Consolas,monospace;line-height:1.5;max-height:40vh;overflow:auto;white-space:pre-wrap;';
        document.body.appendChild(box);
      }
      box.textContent = '⚠️ 页面出错了（请把这段红字截图发给作者）：\n' + msg + '\n' + (stack || '');
    } catch (e) { /* ignore */ }
  }
  window.addEventListener('error', function (e) {
    showFatal(e.message || '未知错误', (e.error && e.error.stack) || (e.filename + ':' + e.lineno));
  });
  window.addEventListener('unhandledrejection', function (e) {
    showFatal('异步错误: ' + ((e.reason && (e.reason.message || e.reason)) || '未知'));
  });

  const DATA = window.CET_DATA;
  const VOICE = window.CET_VOICE;
  const INTERVIEW = window.CET_INTERVIEW;

  /* ---------------- 基础工具 ---------------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  function empty(s) { return !s || !String(s).trim(); }
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.prototype.slice.call(document.querySelectorAll(sel));

  function toast(msg, kind) {
    let t = $('#toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.className = 'toast show ' + (kind || '');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.className = 'toast'; }, 3200);
  }

  /* ---------------- 账号（本地存储，多用户） ---------------- */
  const LS_USERS = 'cet_users_v1';
  const LS_CURRENT = 'cet_current_user_v1';
  const LS_GLOBAL = 'cet_global_v1';

  function userDataKey(u) { return 'cet_userdata_' + encodeURIComponent(u); }

  function readJSON(key, def) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : def;
    } catch (e) { return def; }
  }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* ignore */ }
  }

  async function hashPassword(pw, salt) {
    const input = salt + '::' + pw + '::cet-site-v1';
    try {
      if (window.crypto && crypto.subtle) {
        const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
        return Array.prototype.map.call(new Uint8Array(buf), (b) => b.toString(16).padStart(2, '0')).join('');
      }
    } catch (e) { /* fallthrough */ }
    // 兜底（非安全上下文）
    let h1 = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) { h1 ^= input.charCodeAt(i); h1 = (h1 * 0x01000193) >>> 0; }
    return 'fnv_' + h1.toString(16);
  }
  function randSalt() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }

  /* 密码强弱检测：0-4 分；0-2 弱，3 中，4 强 */
  function passwordStrength(pw) {
    const s = String(pw || '');
    if (!s) return { score: 0, label: '弱', checks: ['请输入密码'] };
    let score = 0;
    const checks = [];
    if (s.length >= 8) { score++; } else { checks.push('长度至少 8 位'); }
    if (s.length >= 12) score++;
    if (/[a-z]/.test(s) && /[A-Z]/.test(s)) { score++; } else if (/[A-Za-z]/.test(s) && s.length > 0) { checks.push('大小写字母都要有'); }
    if (/\d/.test(s)) { score++; } else { checks.push('包含数字'); }
    if (/[^A-Za-z0-9]/.test(s)) { score++; } else { checks.push('包含符号（如 !@#）'); }
    score = Math.min(4, score);
    const label = score >= 4 ? '强' : score === 3 ? '中' : '弱';
    return { score, label, checks };
  }

  async function register(username, password) {
    const name = String(username || '').trim();
    if (empty(name)) return { ok: false, msg: '请输入用户名' };
    // 用户名：只能用字母或中文（2-16 位）
    if (!/^[A-Za-z\u4e00-\u9fa5]{2,16}$/.test(name)) return { ok: false, msg: '用户名需 2-16 位，只能使用字母或中文（不能含数字和符号）' };
    if (String(password || '').length < 8) return { ok: false, msg: '密码至少 8 位' };
    const st = passwordStrength(password);
    if (st.score < 3) return { ok: false, msg: '密码太弱：' + (st.checks.join('、') || '请换一个更复杂的密码') };
    const users = readJSON(LS_USERS, {});
    if (users[name]) return { ok: false, msg: '账号已存在，请直接登录' };
    const salt = randSalt();
    users[name] = { salt, hash: await hashPassword(password, salt), created: Date.now() };
    writeJSON(LS_USERS, users);
    writeJSON(userDataKey(name), { profile: {}, settings: {}, history: [], listening: [], created: Date.now() });
    localStorage.setItem(LS_CURRENT, name);
    return { ok: true, name };
  }

  async function login(username, password) {
    const name = String(username || '').trim();
    if (empty(name) || empty(password)) return { ok: false, msg: '请输入账号和密码' };
    const users = readJSON(LS_USERS, {});
    const u = users[name];
    if (!u) return { ok: false, msg: '账号不存在，请先注册' };
    const h = await hashPassword(String(password), u.salt);
    if (h !== u.hash) return { ok: false, msg: '密码不正确' };
    localStorage.setItem(LS_CURRENT, name);
    return { ok: true, name };
  }

  function logout() {
    localStorage.removeItem(LS_CURRENT);
    VOICE.stopSpeaking();
    INTERVIEW.stop();
    location.reload();
  }

  function currentUser() {
    try { return localStorage.getItem(LS_CURRENT); } catch (e) { return null; }
  }

  /* 当前账号数据（含设置/历史） */
  function getUserData() {
    const u = currentUser();
    if (!u) return null;
    return readJSON(userDataKey(u), { profile: {}, settings: {}, history: [], listening: [] });
  }
  function saveUserData(d) {
    const u = currentUser();
    if (!u) return;
    writeJSON(userDataKey(u), d);
  }
  function getAccount() {
    const name = currentUser();
    const d = getUserData();
    if (!name || !d) return null;
    return {
      username: name,
      apiKey: (d.settings && d.settings.apiKey) || '',
      model: (d.settings && d.settings.model) || 'deepseek-chat',
      level: (d.profile && d.profile.level) || 4,
      sessionId: (d.profile && d.profile.sessionId) || '2026-2',
      settings: d.settings || {},
      profile: d.profile || {},
    };
  }

  /* ---------------- 全局视图（带"返回上一级"历史栈） ---------------- */
  const viewStack = [];

  function updateBackButton(id) {
    const back = $('#btn-back');
    if (!back) return;
    const show = id !== 'view-home' && id !== 'view-login' && viewStack.length > 0;
    back.style.display = show ? 'inline-flex' : 'none';
  }

  function showView(id, fromBack) {
    const prev = document.querySelector('.view.active');
    const prevId = prev ? prev.id : null;
    if (prevId && prevId !== id && !fromBack) {
      if (id === 'view-home') { viewStack.length = 0; }
      else { viewStack.push(prevId); }
    }
    $$('.view').forEach((v) => v.classList.remove('active'));
    const el = $('#' + id);
    if (el) el.classList.add('active');
    // 移动端底部导航高亮
    $$('.tab-btn').forEach((b) => b.classList.toggle('on', b.dataset.view === id));
    if (id !== 'view-interview') { VOICE.stopSpeaking(); }
    updateBackButton(id);
    window.scrollTo({ top: 0 });
  }

  function goBack() {
    const target = viewStack.pop() || 'view-home';
    showView(target, true);
  }

  function bindTabNav() {
    $$('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => showView(btn.dataset.view));
    });
  }

  /* ---------------- 登录页 ---------------- */
  function bindLogin() {
    const tabs = $$('.login-tab');
    const meter = $('#pw-meter');
    function setMode(mode) {
      tabs.forEach((t) => t.classList.toggle('on', t.dataset.mode === mode));
      $('#login-title').textContent = mode === 'login' ? '欢迎回来' : '创建账号';
      $('#login-sub').textContent =
        mode === 'login' ? '登录后管理你的练习记录与考试倒计时' : '用户名只能用字母或中文；密码建议 8 位以上、字母+数字+符号';
      $('#login-btn').textContent = mode === 'login' ? '登录' : '注册';
      if (meter) meter.style.display = mode === 'register' ? 'block' : 'none';
    }
    tabs.forEach((t) => t.addEventListener('click', () => setMode(t.dataset.mode)));

    // 密码强度实时检测（注册时显示）
    const pwInput = $('#login-password');
    if (pwInput) {
      pwInput.addEventListener('input', function () {
        if (!meter) return;
        const val = this.value;
        const st = passwordStrength(val);
        if (!val) {
          meter.className = 'pw-meter pw-0';
          $('#pw-tip').textContent = '';
          return;
        }
        meter.className = 'pw-meter pw-' + st.score;
        $('#pw-tip').textContent = '强度：' + st.label + (st.checks.length ? '（还差：' + st.checks.join('、') + '）' : '，可以使用！');
      });
    }

    $('#login-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const u = $('#login-username').value, p = $('#login-password').value;
      const mode = $('#login-btn').textContent === '登录' ? 'login' : 'register';
      const err = $('#login-err');
      err.textContent = '';
      if (mode === 'register') {
        const st = passwordStrength(p);
        if (String(p || '').length < 8) { err.textContent = '密码至少 8 位'; return; }
        if (st.score < 3) { err.textContent = '密码太弱：' + (st.checks.join('、') || '请换一个更复杂的密码'); return; }
      }
      const res = mode === 'login' ? await login(u, p) : await register(u, p);
      if (!res.ok) { err.textContent = res.msg; return; }
      enterApp();
    });
  }

  /* ---------------- 首页：倒计时 ---------------- */
  function fmtDate(iso) {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.getFullYear() + '年' + (d.getMonth() + 1) + '月' + d.getDate() + '日';
  }
  function fmtDay(iso) {
    const s = iso.split('-');
    return Number(s[1]) + '月' + Number(s[2]) + '日';
  }

  function diffText(iso) {
    const target = new Date(iso + 'T00:00:00').getTime();
    const now = Date.now();
    if (isNaN(target)) return { txt: '日期未知', done: false };
    const ms = target - now;
    if (ms <= 0) return { txt: ms > -86400000 ? '就是今天!' : '已结束', done: true };
    const days = Math.floor(ms / 86400000);
    const hours = Math.floor((ms % 86400000) / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return { txt: `${days} 天 ${String(hours).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`, done: false, days };
  }

  function renderCountdown() {
    const acc = getAccount();
    if (!acc) return;
    const session = DATA.EXAM_SESSIONS.find((s) => s.id === acc.sessionId);
    if (!session) return;
    const oralDate = acc.level === 4 ? session.oral4 : session.oral6;

    const el = $('#countdown-body');
    if (!el) return;

    // 年份选择（仅当配置变化时重建，避免干扰交互）
    const sel = $('#year-select');
    if (sel && sel.dataset.sid !== acc.sessionId) {
      sel.dataset.sid = acc.sessionId;
      sel.innerHTML = DATA.EXAM_SESSIONS.map((s) =>
        '<option value="' + s.id + '"' + (s.id === acc.sessionId ? ' selected' : '') + '>' + esc(s.label) + (s.note ? '（' + s.note + '）' : '') + '</option>'
      ).join('');
    }

    // 结构只建一次
    if (!el.dataset.built || el.dataset.built !== acc.sessionId + '|' + acc.level) {
      el.dataset.built = acc.sessionId + '|' + acc.level;
      el.innerHTML =
        '<div class="count-grid">' +
          '<div class="count-card oral">' +
            '<div class="count-label">口语考试（CET-SET' + acc.level + '）</div>' +
            '<div class="count-date">' + fmtDay(oralDate) + ' · ' + (acc.level === 4 ? '四级口试日' : '六级口试日') + '</div>' +
            '<div class="count-num" id="cd-oral-num"></div>' +
          '</div>' +
          '<div class="count-card written">' +
            '<div class="count-label">笔试（含听力，CET' + acc.level + '）</div>' +
            '<div class="count-date">' + fmtDay(session.written) + ' · 上午考四级 / 下午考六级</div>' +
            '<div class="count-num" id="cd-written-num"></div>' +
          '</div>' +
        '</div>' +
        '<div class="count-note">口试与笔试（含听力）不是同一天：'+ esc(fmtDay(oralDate)) +' 口试 → '+ esc(fmtDay(session.written)) +' 笔试。数据来源：教育部教育考试院官网（见页脚）。</div>';
    }

    // 每秒刷新数字
    const oral = diffText(oralDate);
    const written = diffText(session.written);
    const on = document.getElementById('cd-oral-num');
    const wn = document.getElementById('cd-written-num');
    if (on) { on.textContent = oral.txt; on.classList.toggle('done', !!oral.done); }
    if (wn) { wn.textContent = written.txt; wn.classList.toggle('done', !!written.done); }
  }

  function bindHome() {
    const sel = $('#year-select');
    if (sel) sel.addEventListener('change', () => {
      const d = getUserData();
      if (!d) return;
      d.profile = d.profile || {};
      d.profile.sessionId = sel.value;
      saveUserData(d);
      renderCountdown();
    });

    $('#btn-interview-real').addEventListener('click', () => startInterview('真题'));
    $('#btn-interview-mock').addEventListener('click', () => startInterview('模拟'));
    $('#btn-listening').addEventListener('click', () => { showView('view-listening'); renderListening(); });
    $('#btn-history').addEventListener('click', () => { showView('view-history'); renderHistory(); });
    $('#btn-settings').addEventListener('click', () => { showView('view-settings'); renderSettings(); });
  }

  /* ---------------- 等级切换 ---------------- */
  function bindLevel() {
    const acc = getAccount();
    function apply() {
      const a = getAccount();
      $$('#nav-level .seg-btn').forEach((b) => b.classList.toggle('on', Number(b.dataset.level) === a.level));
      renderCountdown();
      if ($('#view-listening').classList.contains('active')) renderListening();
    }
    $$('#nav-level .seg-btn').forEach((b) => {
      b.addEventListener('click', () => {
        const d = getUserData();
        if (!d) return;
        d.profile = d.profile || {};
        d.profile.level = Number(b.dataset.level);
        saveUserData(d);
        apply();
        toast('已切换到' + (b.dataset.level === '4' ? '四级' : '六级') + '模式');
      });
    });
    apply();
  }

  /* ---------------- 面试 ---------------- */
  function startInterview(mode) {
    const acc = getAccount();
    if (!acc) return;
    showView('view-interview');
    $('#interview-chat').innerHTML = '';
    $('#interview-passage-panel').style.display = 'none';
    $('#interview-prompt-panel').style.display = 'none';
    const phEl = $('#interview-phase');
    if (phEl) phEl.textContent = '';
    $('#interview-part').textContent = '正在准备…';
    $('#result-modal').classList.remove('show');
    $('#interview-input').value = '';
    $('#interview-input').disabled = false;
    $('#interview-send').disabled = false;
    $('#interview-done').disabled = true;
    $('#interview-mic').disabled = false;
    renderTimerRing(0, 1);

    INTERVIEW.start({
      level: acc.level,
      mode,
      onEvent: handleInterviewEvent,
    });
    window._curInterviewMode = mode;
  }

  function addBubble(name, text, meta) {
    const chat = $('#interview-chat');
    const row = document.createElement('div');
    row.className = 'msg ' + (name === '你' ? 'me' : 'ai');
    const isEng = /^[A-Za-z0-9 .?!,'-]+$/.test((text || '').trim()) && text && text.trim().length > 0;
    row.innerHTML = '<div class="msg-name">' + esc(name) + '</div><div class="msg-bubble' + (meta && meta.answered === false ? ' muted' : '') + '">' + (isEng ? esc(text) : esc(text)) + '</div>';
    chat.appendChild(row);
    chat.scrollTop = chat.scrollHeight;

    // 朗读按钮（可重听考官）
    if (name === '考官') {
      const btn = document.createElement('button');
      btn.className = 'replay-btn';
      btn.textContent = '🔊 重听';
      btn.addEventListener('click', () => VOICE.speak(text, { rate: 0.98 }));
      row.querySelector('.msg-bubble').appendChild(btn);
    }
  }

  function setTimerRing(sec, total) {
    const ring = $('#timer-ring-progress');
    const txt = $('#timer-text');
    if (!ring) return;
    const max = total || 1;
    const pct = Math.max(0, Math.min(1, sec / max));
    const C = 2 * Math.PI * 44;
    ring.style.strokeDashoffset = C * (1 - pct);
    txt.textContent = sec + 's';
  }
  function renderTimerRing(sec, total) {
    setTimerRing(sec == null ? 0 : sec, total || 1);
  }

  function handleInterviewEvent(type, payload) {
    const eng = INTERVIEW.getEngine && INTERVIEW.getEngine();
    switch (type) {
      case 'line':
        addBubble(payload.name, payload.text, payload.meta);
        break;
      case 'system':
      case 'sysnote':
        addBubble('提示', payload.text || payload, payload.kind ? { answered: false } : {});
        if (payload.kind) payload = payload; break;
      case 'phase': {
        const ph = $('#interview-phase');
        if (ph) ph.textContent = payload.label || '';
        if (payload.name === 'scoring') { renderTimerRing(0, 1); }
        break;
      }
      case 'prep': {
        const total = (eng && eng.flow[eng.stepIdx] && eng.flow[eng.stepIdx].prep) || 45;
        setTimerRing(payload.seconds, total);
        $('#interview-done').disabled = false;
        $('#interview-done').textContent = '开始作答';
        break;
      }
      case 'speak': {
        const step = eng && eng.flow[eng.stepIdx];
        const total = (step && step.seconds) || 60;
        if (payload.active) {
          setTimerRing(payload.seconds, total);
          $('#interview-done').disabled = false;
          $('#interview-done').textContent = '说完了';
          $('#interview-input').focus();
        } else {
          $('#interview-done').disabled = true;
        }
        $('#interview-mic').classList.toggle('listening', !!payload.listening);
        break;
      }
      case 'interim': {
        $('#interview-input').value = payload || '';
        break;
      }
      case 'reading': {
        const pp = $('#interview-passage-panel');
        pp.style.display = 'block';
        pp.innerHTML =
          '<div class="panel-title">📖 朗读短文（约120词 · 先准备45秒，再朗读1分钟）</div>' +
          '<div class="passage-text">' + esc(payload.passage.text) + '</div>';
        break;
      }
      case 'prompt': {
        const pp = $('#interview-prompt-panel');
        pp.style.display = 'block';
        pp.innerHTML = '<div class="panel-title">💬 本题任务：' + esc(payload.topic || '') + '</div>' +
          '<div class="passage-text">' + esc(payload.prompt || payload.scenario || '') + '</div>';
        break;
      }
      case 'state': {
        if (payload.phase === 'stopped') return;
        const step = eng && eng.flow[eng.stepIdx];
        const part = step ? step.part : '';
        $('#interview-part').textContent = part || '';
        if (eng && eng.usingApi && !eng.apiFailed) {
          $('#interview-eng-badge').textContent = 'DeepSeek 智能考官';
          $('#interview-eng-badge').className = 'eng-badge api';
        } else {
          $('#interview-eng-badge').textContent = '本地考官（未配置 API Key）';
          $('#interview-eng-badge').className = 'eng-badge local';
        }
        break;
      }
      case 'result':
        showResult(eng, payload);
        break;
    }
  }

  function showResult(eng, score) {
    const d = score.dimensions || {};
    const dimNames = {
      content: '内容切题', fluency: '流畅度', vocabulary: '词汇', grammar: '语法',
      pronunciation: '语音语调', interaction: '互动交际',
    };
    const dimsHtml = Object.keys(dimNames).map((k) => {
      const v = Number(d[k] || 0).toFixed(1);
      const pct = Math.min(100, (Number(d[k]) / 5) * 100);
      return '<div class="dim"><div class="dim-head"><span>' + dimNames[k] + '</span><span>' + v + ' / 5</span></div>' +
        '<div class="dim-bar"><div style="width:' + pct + '%"></div></div>' +
        (score.comments && score.comments[k] ? '<div class="dim-cmt">' + esc(score.comments[k]) + '</div>' : '') +
        '</div>';
    }).join('');

    const grade = score.grade || '—';
    const gradeInfo = DATA.GRADE_RULES.find((g) => g.grade === grade);
    const modal = $('#result-modal');
    modal.innerHTML =
      '<div class="modal-card">' +
        '<button class="modal-close" data-close="1">✕</button>' +
        '<div class="score-head">' +
          '<div class="score-ring' + (grade === 'A' ? ' a' : grade === 'B' ? ' b' : grade === 'C' ? ' c' : ' d') + '">' +
            '<span class="score-total">' + Number(score.total || 0).toFixed(1) + '</span><span class="score-grade">等级 ' + grade + '</span>' +
          '</div>' +
          '<div class="score-info">' +
            '<div class="score-title">' + (gradeInfo ? gradeInfo.label + '（' + gradeInfo.range + '）' : '') + '</div>' +
            '<div class="score-desc">' + (gradeInfo ? esc(gradeInfo.desc) : '') + '</div>' +
            (score.engine === 'api' ? '<div class="score-mode api">评分类别：DeepSeek 智能评分</div>' : '<div class="score-mode local">评分类别：本地估分（请配置 API Key 获得智能点评）</div>') +
          '</div>' +
        '</div>' +
        '<div class="dims">' + dimsHtml + '</div>' +
        (score.advice ? '<div class="advice"><div class="advice-title">📝 考官建议</div><div>' + esc(score.advice) + '</div></div>' : '') +
        '<div class="modal-actions">' +
          '<button class="btn btn-ghost" data-again="1">再练一次</button>' +
          '<button class="btn btn-primary" data-close="1">完成</button>' +
        '</div>' +
      '</div>';
    modal.classList.add('show');

    modal.querySelector('[data-close]').addEventListener('click', () => modal.classList.remove('show'));
    modal.querySelector('[data-again]').addEventListener('click', () => {
      modal.classList.remove('show');
      startInterview(window._curInterviewMode || '真题');
    });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });

    // 保存历史
    try {
      const acc = getAccount();
      const engState = INTERVIEW.getEngine && INTERVIEW.getEngine();
      saveInterviewHistory({
        level: acc.level,
        mode: window._curInterviewMode || '真题',
        total: score.total,
        grade,
        dims: d,
        advice: score.advice || '',
        engine: score.engine,
        transcript: engState ? engState.transcript.map((m) => ({ name: m.name, text: m.text })) : [],
        time: new Date().toISOString(),
      });
    } catch (e) { /* ignore */ }
    renderHistory();
  }

  function saveInterviewHistory(entry) {
    const u = getUserData();
    if (!u) return;
    u.history = u.history || [];
    u.history.unshift(entry);
    if (u.history.length > 200) u.history.length = 200;
    saveUserData(u);
  }

  function saveListeningHistory(entry) {
    const u = getUserData();
    if (!u) return;
    u.listening = u.listening || [];
    u.listening.unshift(entry);
    saveUserData(u);
  }

  /* ---------------- 历史 ---------------- */
  function renderHistory() {
    const u = getUserData();
    const wrap = $('#history-list');
    if (!wrap) return;
    const hist = (u && u.history) || [];
    const listen = (u && u.listening) || [];
    if (!hist.length && !listen.length) {
      wrap.innerHTML = '<div class="empty">还没有练习记录。去“真题模拟面试”或“听力练习”开一把吧！</div>';
      return;
    }
    let html = '<div class="hist-title">🎙 口语模拟成绩</div>';
    if (!hist.length) html += '<div class="empty small">暂无口语模拟记录</div>';
    hist.slice(0, 20).forEach((h) => {
      const d = new Date(h.time);
      html +=
        '<div class="hist-row">' +
          '<div class="hist-main"><span class="hist-badge">CET' + h.level + (h.mode === '模拟' ? '·模拟' : '·真题') + '</span> ' +
          '<b>' + Number(h.total || 0).toFixed(1) + ' 分</b> <span class="hist-grade ' + (h.grade || '').toLowerCase() + '">' + esc(h.grade || '—') + '</span></div>' +
          '<div class="hist-time">' + d.toLocaleString('zh-CN', { hour12: false }) + (h.engine === 'api' ? '' : ' · 本地估分') + '</div>' +
        '</div>';
    });
    html += '<div class="hist-title" style="margin-top:18px">🎧 听力练习记录</div>';
    if (!listen.length) html += '<div class="empty small">暂无听力记录</div>';
    listen.slice(0, 20).forEach((h) => {
      html += '<div class="hist-row"><div class="hist-main"><span class="hist-badge listen">听力</span> <b>' + esc(h.title || h.set) + '</b>：' + h.correct + '/' + h.total + '（' + h.pct + '%）</div></div>';
    });
    wrap.innerHTML = html;
  }

  /* ---------------- 听力 ---------------- */
  function renderListening() {
    const acc = getAccount();
    const wrap = $('#listen-list');
    if (!wrap) return;
    const work = $('#listen-work-area');
    if (work) work.style.display = 'none';
    window.CET_LISTENING.renderList(wrap, acc.level);
  }

  /* ---------------- 设置 ---------------- */
  function renderSettings() {
    if (!$('#view-settings').classList.contains('active')) return;
    const acc = getAccount();
    const s = acc.settings || {};
    $('#set-api').value = acc.apiKey || '';
    $('#set-model').value = acc.model || 'deepseek-chat';
    $('#set-rate').value = s.rate != null ? s.rate : 1.0;
    $('#set-rate-val').textContent = '语速 ×' + (s.rate != null ? s.rate : 1.0).toFixed(1);
    $('#set-voice').value = s.voice || 'en-US';
    $('#set-dark').checked = !!(s.dark);
    $('#set-user').textContent = acc.username;
    const cap = VOICE.capabilityReport();
    $('#cap-report').innerHTML =
      '<div class="cap-row">浏览器：' + esc(cap.engine) + '</div>' +
      '<div class="cap-row">语音合成（考官说话）：' + (cap.tts ? '✅ 可用' : '❌ 不可用（将静默显示文字）') + '</div>' +
      '<div class="cap-row">语音识别（你说英语）：' + (cap.stt ? '✅ 可用' : '⚠️ 不可用（请用打字输入，推荐 Edge/Chrome）') + '</div>' +
      '<div class="cap-row">安全环境（麦克风要求）：' + (cap.secure ? '✅ 是（本机 localhost 访问）' : '⚠️ 否 —— 电脑端请用 http://127.0.0.1:8123 打开（语音可用）；手机访问此 HTTP 地址时语音会被系统禁用，可在输入框用手机键盘的 🎤听写，或改用 https 地址（需安装证书）') + '</div>';
  }

  function bindSettings() {
    $('#set-api').addEventListener('input', saveSettingsDebounced);
    $('#set-model').addEventListener('change', saveSettingsDebounced);
    $('#set-rate').addEventListener('input', () => {
      $('#set-rate-val').textContent = '语速 ×' + Number($('#set-rate').value).toFixed(1);
      saveSettingsDebounced();
    });
    $('#set-voice').addEventListener('change', saveSettingsDebounced);
    $('#set-dark').addEventListener('change', () => {
      saveSettingsDebounced();
      applyDark();
    });

    $('#test-api').addEventListener('click', async () => {
      const btn = $('#test-api');
      btn.disabled = true;
      btn.textContent = '测试中…';
      try {
        const key = $('#set-api').value.trim();
        if (!key) throw new Error('请先填写 API Key');
        const resp = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            apiKey: key,
            model: $('#set-model').value || 'deepseek-chat',
            messages: [{ role: 'user', content: 'Reply with exactly: API_OK' }],
            max_tokens: 10,
          }),
        });
        const txt = await resp.text();
        if (resp.ok && txt.indexOf('API_OK') >= 0) {
          toast('✅ API Key 有效！AI 考官已就绪');
        } else {
          let msg = txt;
          try { const j = JSON.parse(txt); msg = (j.error && (j.error.message || j.error)) || msg; } catch (e) { /* ignore */ }
          toast('❌ ' + msg);
        }
      } catch (e) {
        toast('❌ ' + e.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '测试连接';
      }
    });

    $('#export-data').addEventListener('click', () => {
      try {
        const blob = new Blob([JSON.stringify(getUserData(), null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = '四六级练习数据备份_' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
        toast('已导出备份文件（含成绩/设置）');
      } catch (e) { toast('导出失败：' + e.message); }
    });
    $('#import-data').addEventListener('click', () => $('#import-file').click());
    $('#import-file').addEventListener('change', (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const j = JSON.parse(rd.result);
          if (!j || typeof j !== 'object') throw new Error('格式错误');
          const u = getUserData();
          const merged = Object.assign({}, u, j);
          saveUserData(merged);
          toast('✅ 导入成功');
          renderSettings();
          renderCountdown();
        } catch (err) {
          toast('导入失败：' + err.message);
        }
      };
      rd.readAsText(f);
      e.target.value = '';
    });
    $('#clear-data').addEventListener('click', () => {
      if (confirm('确定清除当前账号的所有练习记录（保留账号与设置）？')) {
        const u = getUserData();
        if (u) { u.history = []; u.listening = []; saveUserData(u); }
        renderHistory();
        toast('已清除练习记录');
      }
    });
    $('#del-account').addEventListener('click', () => {
      const name = currentUser();
      if (confirm('确定删除账号「' + name + '」及其全部数据？此操作不可恢复。')) {
        const users = readJSON(LS_USERS, {});
        delete users[name];
        writeJSON(LS_USERS, users);
        localStorage.removeItem(userDataKey(name));
        localStorage.removeItem(LS_CURRENT);
        location.reload();
      }
    });
  }

  let _savedTimer = null;
  function saveSettingsDebounced() {
    clearTimeout(_savedTimer);
    _savedTimer = setTimeout(() => {
      const u = getUserData();
      if (!u) return;
      u.settings = {
        apiKey: $('#set-api').value.trim(),
        model: $('#set-model').value || 'deepseek-chat',
        rate: Number($('#set-rate').value),
        voice: $('#set-voice').value,
        dark: !!$('#set-dark').checked,
      };
      // 记录 Key 设置时间但不显示
      if (u.settings.apiKey) u.settings._keySetAt = Date.now();
      saveUserData(u);
      const acc = getAccount();
      if ($('#interview-eng-badge')) {
        $('#interview-eng-badge').textContent = acc.apiKey ? 'DeepSeek 智能考官' : '本地考官（未配置 API Key）';
        $('#interview-eng-badge').className = 'eng-badge ' + (acc.apiKey ? 'api' : 'local');
      }
    }, 400);
  }

  function applyDark() {
    const u = getUserData();
    const dark = u && u.settings && u.settings.dark;
    document.documentElement.classList.toggle('dark', !!dark);
  }

  /* ---------------- 页脚信息 ---------------- */
  function renderFooter() {
    const el = $('#sources');
    if (!el) return;
    el.innerHTML = DATA.EXAM_SOURCES.map((s) => '<a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.label) + '</a>').join(' · ');
  }

  /* ---------------- 进入应用 ---------------- */
  function enterApp() {
    try {
      $('#view-login').classList.remove('active');
      $('#view-app').classList.add('active');
      $('#user-name').textContent = currentUser();
      applyDark();
      bindLevel();
      renderCountdown();
      renderFooter();
      showView('view-home');
      toast('欢迎回来，' + currentUser() + ' 🎉');
    } catch (e) {
      showFatal(e.message, e.stack);
      // 出错时也尽量把首页外壳显示出来
      try {
        $('#view-app').classList.add('active');
        showView('view-home');
      } catch (e2) { /* ignore */ }
    }
  }

  /* ---------------- 初始化 ---------------- */
  function init() {
    renderFooter();
    const user = currentUser();
    if (user && readJSON(LS_USERS, {})[user]) {
      enterApp();
    } else {
      $('#view-app').classList.remove('active');
      $('#view-login').classList.add('active');
    }
    bindLogin();
    bindTabNav();
    bindHome();
    bindSettings();
    const backBtn = $('#btn-back');
    if (backBtn) backBtn.addEventListener('click', goBack);
    $('#logout-btn').addEventListener('click', logout);

    // 每秒刷新倒计时
    setInterval(() => { if ($('#view-home').classList.contains('active')) renderCountdown(); }, 1000);
    // 面试界面控件
    const engShared = INTERVIEW;
    $('#interview-send').addEventListener('click', () => {
      const inp = $('#interview-input');
      const txt = inp.value.trim();
      if (!txt) return;
      const eng = engShared.getEngine && engShared.getEngine();
      if (eng && eng.submitText(txt)) {
        inp.value = '';
        eng.endAnswer();
      }
    });
    $('#interview-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') $('#interview-send').click();
    });
    $('#interview-done').addEventListener('click', () => {
      const eng = engShared.getEngine && engShared.getEngine();
      if (!eng) return;
      if (eng.inPrep) { eng.skipPrep(); return; }
      eng.endAnswer();
    });
    $('#interview-mic').addEventListener('click', () => {
      const eng = engShared.getEngine && engShared.getEngine();
      if (!eng) return;
      if (window.CET_VOICE.sttState()) return;
      // 触发一次语音识别（若有正在进行则忽略）
      const h = eng.busyCollect;
      if (!h || h.finished) { toast('现在不是你的作答时间'); return; }
      if (h.stt) { try { h.stt.abort(); } catch (e) {} }
      h.stt = VOICE.listen({
        lang: 'en-US',
        interim: (txt) => { h.text = txt; $('#interview-input').value = txt; },
        onFinalRaw: (txt) => { h.text = txt; $('#interview-input').value = txt; },
        onError: (err) => toast(err.message),
        onEnd: (r) => { if (r && r.final) $('#interview-input').value = r.final; },
      });
    });
    $('#interview-stop').addEventListener('click', () => {
      if (confirm('结束本次模拟面试？将立即生成评分。')) {
        const eng = engShared.getEngine && engShared.getEngine();
        if (eng) eng.finish();
      }
    });
    // 设置里的“保存”由防抖自动保存
  }

  document.addEventListener('DOMContentLoaded', init);

  return {
    getAccount,
    getUserData,
    saveUserData,
    saveInterviewHistory,
    saveListeningHistory,
    esc,
  };
})();