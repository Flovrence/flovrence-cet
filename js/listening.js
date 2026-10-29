/* ============================================================
 * 听力专项练习：浏览器 TTS 朗读 → 选择题作答 → 自动批改
 * 全部原文为本站原创仿真题（避免版权），由系统语音按考试语速朗读
 * ============================================================ */
window.CET_LISTENING = (function () {

  const DATA = window.CET_DATA;
  const VOICE = window.CET_VOICE;

  let activeSet = null;
  let activeSectionIdx = 0;
  let selections = {};      // { sectionIdx: { qIdx: answerIdx } }
  let playing = false;
  let currentEl = null;

  /* ---------- 列表 ---------- */
  function renderList(root, level) {
    root.innerHTML = '';
    const sets = DATA.LISTENING_SETS.filter((s) => s.level === level);
    if (!sets.length) {
      root.innerHTML = '<p class="empty">暂无听力套题</p>';
      return;
    }
    sets.forEach((set) => {
      const card = document.createElement('div');
      card.className = 'card list-card';
      const totalQ = set.sections.reduce((s, x) => s + (x.questions ? x.questions.length : 0), 0);
      card.innerHTML =
        '<div class="list-card-head">' +
          '<div><div class="card-title">' + esc(set.title) + '</div>' +
          '<div class="card-sub">' + esc(set.tip || '') + '</div></div>' +
          '<button class="btn btn-primary btn-sm" data-start="' + esc(set.id) + '">开始练习</button>' +
        '</div>';
      card.querySelector('[data-start]').addEventListener('click', () => {
        const wrap = document.getElementById('listen-work-area');
        wrap.style.display = 'block';
        wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
        startSet(set, wrap);
      });
      root.appendChild(card);
    });
  }

  /* ---------- 开始一套 ---------- */
  function startSet(set, container) {
    activeSet = set;
    activeSectionIdx = 0;
    selections = {};
    if (currentEl && currentEl !== container) currentEl.innerHTML = '';
    renderSection(container);
  }

  function renderSection(container) {
    currentEl = container;
    const sec = activeSet.sections[activeSectionIdx];
    const qs = sec.questions || [];
    const secSel = selections[activeSectionIdx] || {};
    const answered = Object.keys(secSel).length;

    const backBtn = activeSectionIdx > 0
      ? '<button class="btn btn-ghost btn-sm" data-nav="-1">← 上一组</button>' : '';
    const nextBtn = activeSectionIdx < activeSet.sections.length - 1
      ? '<button class="btn btn-primary btn-sm" data-nav="1">下一组 →</button>'
      : '<button class="btn btn-success btn-sm" data-submit="1">交卷评分</button>';

    let qHtml = '';
    qs.forEach((q, qi) => {
      let opts = '';
      (q.options || []).forEach((o, oi) => {
        const checked = secSel[qi] === oi ? ' checked' : '';
        const label = String.fromCharCode(65 + oi);
        opts += '<label class="opt' + checked + '"><input type="radio" name="q' + qi + '" value="' + oi + '"' + checked + ' onchange="CET_LISTENING.pick(' + activeSectionIdx + ',' + qi + ',' + oi + ')"><span>' + label + '. ' + esc(o) + '</span></label>';
      });
      qHtml +=
        '<div class="lq">' +
          '<div class="lq-q">' + (qi + 1) + '. ' + esc(q.q) + '</div>' +
          '<div class="opt-group">' + opts + '</div>' +
        '</div>';
    });

    container.innerHTML =
      '<div class="listen-head">' +
        '<div class="card-title">' + esc(activeSet.title) + '</div>' +
        '<div class="lq-tag">' + esc(sec.title) + ' · ' + (activeSectionIdx + 1) + '/' + activeSet.sections.length + ' 组 · 已答 ' + answered + '/' + qs.length + '</div>' +
      '</div>' +
      '<div class="listen-controls">' +
        '<button class="btn btn-primary btn-lg" data-play="1">▶ 播放听力</button>' +
        '<button class="btn btn-ghost" data-replay="1">重听</button>' +
        '<span class="listen-status" id="listen-status"></span>' +
      '</div>' +
      '<div class="listen-passage" id="listen-passage" style="display:none"></div>' +
      '<div class="questions">' + qHtml + '</div>' +
      '<div class="listen-nav">' + backBtn + nextBtn + '</div>' +
      '<div class="listen-err" id="listen-err"></div>';

    container.querySelector('[data-play]').addEventListener('click', () => playPassage(sec));
    container.querySelector('[data-replay]').addEventListener('click', () => playPassage(sec, true));
    const nav = container.querySelector('[data-nav]');
    if (nav) nav.addEventListener('click', () => { activeSectionIdx += Number(nav.dataset.nav); renderSection(container); });
    const submit = container.querySelector('[data-submit]');
    if (submit) submit.addEventListener('click', () => grade(container));
  }

  function playPassage(sec, replay) {
    if (playing && !replay) return;
    const status = document.getElementById('listen-status');
    const err = document.getElementById('listen-err');
    if (err) err.textContent = '';
    if (status) { status.textContent = '正在朗读…'; status.className = 'listen-status on'; }
    playing = true;
    // 对话文本中的换行转为停顿
    const text = sec.passage.replace(/\s*\n\s*/g, '. ').replace(/\s+/g, ' ').trim();
    VOICE.speak(text, { rate: 0.95 })
      .then(() => { playing = false; if (status) { status.textContent = '播放结束'; status.className = 'listen-status'; } })
      .catch(() => { playing = false; if (status) { status.textContent = '播放出错'; status.className = 'listen-status'; } });
  }

  function pick(secIdx, qIdx, val) {
    if (!selections[secIdx]) selections[secIdx] = {};
    selections[secIdx][qIdx] = val;
    const sec = activeSet.sections[activeSectionIdx];
    const answered = Object.keys(selections[activeSectionIdx] || {}).length;
    const tag = currentEl && currentEl.querySelector('.lq-tag');
    if (tag && sec) tag.textContent = esc(sec.title) + ' · ' + (activeSectionIdx + 1) + '/' + activeSet.sections.length + ' 组 · 已答 ' + answered + '/' + (sec.questions || []).length;
  }

  /* ---------- 交卷评分 ---------- */
  function grade(container) {
    let correct = 0, total = 0;
    const detail = [];
    activeSet.sections.forEach((sec, si) => {
      (sec.questions || []).forEach((q, qi) => {
        total++;
        const ans = (selections[si] || {})[qi];
        const ok = ans === q.answer;
        if (ok) correct++;
        detail.push({ section: sec.title, q: q.q, opts: q.options, answer: q.answer, picked: ans, ok, explain: q.explain });
      });
    });
    const pct = total ? Math.round((correct / total) * 100) : 0;

    let dHtml = '';
    detail.forEach((d, i) => {
      const mark = d.ok ? '✓' : '✗';
      const markCls = d.ok ? 'ok' : 'no';
      dHtml +=
        '<div class="rd">' +
          '<div class="rd-head"><span class="rd-mark ' + markCls + '">' + mark + '</span> <span class="rd-q">' + (i + 1) + '. ' + esc(d.q) + '</span></div>' +
          '<div class="rd-opts">' + d.opts.map((o, oi) =>
            '<div class="' + (oi === d.answer ? 'rd-right' : (oi === d.picked ? 'rd-wrong' : '')) + '">' + String.fromCharCode(65 + oi) + '. ' + esc(o) + (oi === d.answer ? '（正确答案）' : (oi === d.picked ? '（你的选择）' : '')) + '</div>'
          ).join('') + '</div>' +
          (d.explain ? '<div class="rd-exp">解析：' + esc(d.explain) + '</div>' : '') +
        '</div>';
    });

    container.innerHTML =
      '<div class="result-card">' +
        '<div class="result-big">' + correct + ' / ' + total + '</div>' +
        '<div class="result-pct">正确率 ' + pct + '%</div>' +
        (pct >= 80 ? '<div class="result-tip good">很棒！听力基础扎实，继续保持。</div>'
          : pct >= 60 ? '<div class="result-tip">不错，但还有提升空间，建议重听一遍再看解析。</div>'
          : '<div class="result-tip">需加强练习：先看解析，再重听原文，最后再练一套。</div>') +
        '<button class="btn btn-ghost" data-retry="1">查看原文</button> ' +
        '<button class="btn btn-primary" data-again="1">再练一遍</button><br><br>' +
        '<div class="rd-list" data-rd="1" style="display:none">' + dHtml + '</div>' +
      '</div>';

    container.querySelector('[data-retry]').addEventListener('click', (e) => {
      const el = container.querySelector('[data-rd]');
      el.style.display = el.style.display === 'none' ? 'block' : 'none';
      e.currentTarget.textContent = el.style.display === 'none' ? '查看原文' : '收起原文';
    });
    container.querySelector('[data-again]').addEventListener('click', () => startSet(activeSet, container));

    // 保存历史
    try {
      window.CET_APP.saveListeningHistory({
        set: activeSet.id,
        title: activeSet.title,
        correct, total, pct,
        time: new Date().toISOString(),
      });
    } catch (e) { /* ignore */ }
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  return { renderList, pick, playPassage };
})();

/* 让 onchange 内联可用 */
window.CET_LISTENING = window.CET_LISTENING;