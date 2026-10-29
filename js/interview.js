/* ============================================================
 * 面试引擎：真题/模拟题 全真口语模拟面试
 * - 按官方 CET-SET4（5部分）/ CET-SET6（3部分）流程推进
 * - AI 考官 = DeepSeek（每位用户自己的 API Key，经本地 /api/chat 转发）
 * - 无 Key / 断网时自动降级为「内置考官脚本 + 本地评分」
 * - 语音交互：TTS 考官说话，STT 考生回答（打字输入兜底）
 * ============================================================ */
window.CET_INTERVIEW = (function () {

  const DATA = window.CET_DATA;
  const VOICE = window.CET_VOICE;

  const SYSTEM_PROMPT_BASE =
    'You are a professional, friendly native-English-speaking examiner for the Chinese National College English Test - Spoken English Test (CET-SET). ' +
    'You are conducting a one-to-one mock interview with a Chinese college student via voice. ' +
    'RULES: 1) Answer ONLY in English. 2) Keep every examiner turn short: 1-3 sentences. 3) Speak like a real examiner: greet naturally, react to what the candidate says with brief acknowledgment (e.g. "I see.", "That sounds great."), and ask natural follow-up questions. 4) During the exam, NEVER give scores, grades or advice about the candidate\'s performance. 5) Do not repeat the candidate\'s words at length. 6) If the candidate\'s speech is very short or unclear, politely encourage them to say a little more. 7) Match your language level to the exam level (CET4: simpler; CET6: more academic). 8) The conversation will be sent to you turn by turn. Only output your next examiner line.';

  /* ---------------- 工具 ---------------- */

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function getSettings() {
    try {
      const acc = window.CET_APP && window.CET_APP.getAccount();
      if (acc) return { apiKey: acc.apiKey || '', model: acc.model || 'deepseek-chat' };
    } catch (e) { /* ignore */ }
    return { apiKey: '', model: 'deepseek-chat' };
  }

  async function chatLLM(messages, opts) {
    opts = opts || {};
    const s = getSettings();
    if (!s.apiKey) throw new Error('NO_KEY');
    const resp = await fetch(((window.CET_API_BASE || '') + '/api/chat'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: s.apiKey,
        model: s.model || 'deepseek-chat',
        messages: messages,
        temperature: opts.temperature != null ? opts.temperature : 0.7,
        max_tokens: opts.max_tokens || 900,
      }),
    });
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error('返回内容异常'); }
    if (!resp.ok) {
      const msg = (data && data.error && (data.error.message || data.error)) || ('接口错误 HTTP ' + resp.status);
      if (resp.status === 401) throw new Error('API KEY 无效，请在“设置”里检查你的 DeepSeek Key');
      if (resp.status === 402) throw new Error('DeepSeek 余额不足，请充值后重试');
      throw new Error(typeof msg === 'string' ? msg : '接口错误');
    }
    const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
    if (!content) throw new Error('返回内容为空');
    return content;
  }

  function extractJSON(text) {
    if (!text) return null;
    const t = text.trim();
    // 直接是JSON
    try { return JSON.parse(t); } catch (e) { /* next */ }
    // 找第一对大括号
    const start = t.indexOf('{');
    if (start < 0) return null;
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < t.length; i++) {
      const c = t[i];
      if (inStr) {
        if (esc) esc = false;
        else if (c === '\\') esc = true;
        else if (c === '"') inStr = false;
      } else {
        if (c === '"') inStr = true;
        else if (c === '{') depth++;
        else if (c === '}') { depth--; if (depth === 0) { try { return JSON.parse(t.slice(start, i + 1)); } catch (e) { return null; } } }
      }
    }
    return null;
  }

  /* ---------------- 本地启发式评分（无 API Key 兜底） ---------------- */
  function stripPunct(s) { return (s || '').replace(/[^a-zA-Z' -]/g, ' '); }
  function tokenize(s) {
    return stripPunct(s).toLowerCase().split(/\s+/).filter((w) => /[a-z]/.test(w));
  }

  function localScore(answers, meta) {
    const DIMS = ['content', 'fluency', 'vocabulary', 'grammar', 'pronunciation', 'interaction'];
    const dims = {};
    const allWords = [];
    let totalChars = 0;
    let responseCount = 0, answeredCount = 0, fillerCount = 0, sentenceCount = 0;
    let keywordsHit = 0, keywordsTotal = 0;

    (answers || []).forEach((a) => {
      const tokens = tokenize(a.text);
      const words = tokens.length;
      totalChars += (a.text || '').length;
      allWords.push(...tokens);
      responseCount++;
      if (words >= 3) answeredCount++;
      sentenceCount += (a.text.match(/[.!?]+/g) || []).length;
      // 填充词
      tokens.forEach((w) => { if (DATA.FILLERS.includes(w)) fillerCount++; });
      // 切题：关键词命中
      const kws = (a.keywords || []).map((k) => k.toLowerCase());
      kws.forEach((k) => {
        keywordsTotal++;
        if (tokens.join(' ').indexOf(k) >= 0 || a.text.toLowerCase().indexOf(k) >= 0) keywordsHit++;
      });
    });

    const unique = new Set(allWords).size;
    const totalWords = allWords.length;

    // 内容切题
    const contentRatio = keywordsTotal ? keywordsHit / keywordsTotal : 0;
    dims.content = Math.min(5, 1.5 + (totalWords >= 25 ? 1 : 0.3) + contentRatio * 2.2 + (sentenceCount >= 2 ? 0.5 : 0));

    // 流畅度：字数充足 + 填充词少
    let flow = 2.2 + Math.min(1.8, totalWords / 120);
    flow -= Math.min(1.5, fillerCount * 0.45);
    flow -= (responseCount && totalWords / responseCount < 8) ? 0.8 : 0;
    dims.fluency = Math.max(0.5, Math.min(5, flow));

    // 词汇：多样性 + 长度
    const variety = totalWords ? unique / totalWords : 0;
    const avgLen = totalWords ? totalChars / totalWords : 0;
    dims.vocabulary = Math.min(5, 1.8 + variety * 3 + (avgLen > 4.2 ? 0.7 : 0));

    // 语法：简单规则检测错误痕迹
    const g = (a.text || '').toLowerCase();
    let err = 0;
    const bad = [/\bhe (don't|doesn't|is|are)\b/, /\bshe (don't|doesn't)\b/, /\bi (is|are|am not sure that)\b/, /(a|an) (apple|book|student|idea|hour)\b/];
    const urls = [/ i /g];
    bad.forEach((re) => { if (re.test(g)) err++; });
    err += Math.min(2, ((g.match(/\bi /g) || []).length)); // 大量 I 开头简单句不算错，不计入
    dims.grammar = Math.max(1, Math.min(5, 3.6 - err * 0.9 + (sentenceCount >= 3 ? 0.5 : 0)));

    // 发音：无真实音频无法评估 → 中性分（明确提示）
    dims.pronunciation = 3.2;

    // 互动：作答比例 + 总时长充分性
    let inter = 2.5 + (responseCount ? (answeredCount / responseCount) * 1.5 : 0);
    inter += totalWords >= 300 ? 1 : (totalWords >= 150 ? 0.6 : 0);
    dims.interaction = Math.min(5, inter);

    Object.keys(dims).forEach((k) => { dims[k] = Math.round(dims[k] * 10) / 10; });
    const avg = Object.keys(dims).reduce((s, k) => s + dims[k], 0) / DIMS.length;
    return {
      engine: 'local',
      dimensions: dims,
      total: Math.round(avg * 10) / 10,
      grade: gradeFor(avg),
      comments: {
        content: contentRatio >= 0.5 ? '回答基本切题，能围绕话题展开。' : '回答与话题关联不够紧密，建议先用关键词列要点再展开。',
        fluency: fillerCount > 6 ? '嗯/啊等填充词偏多，练习时可用语速稍慢但连贯的停顿代替。' : '整体比较流畅，停顿较少。',
        vocabulary: variety > 0.6 ? '词汇较多样。' : '词汇量偏薄，建议多积累话题核心词汇并背诵常用句式。',
        grammar: err > 1 ? '检测到一些基本语法错误，注意主谓一致和冠词使用。' : '语法基本稳定，继续注意时态一致性。',
        pronunciation: '语音识别无法评估发音，建议对照示范音频逐句跟读自查。',
        interaction: inter >= 4 ? '互动完成度高。' : '部分题目未完整作答，考场上每题都应尽量说到规定时长。',
      },
      advice: '本地估分模式（未配置 API Key）。想获得更个性化的点评，请在“设置”中填写你自己的 DeepSeek API Key。',
    };
  }

  function gradeFor(avg) {
    if (avg >= 4.5) return 'A';
    if (avg >= 3.5) return 'B';
    if (avg >= 2.5) return 'C';
    return 'D';
  }

  /* ---------------- 流程构建 ---------------- */
  function buildFlow(level, mode) {
    const Q = level === 4 ? DATA.Q4 : DATA.Q6;
    const flow = [];
    if (level === 4) {
      // Part 1 自我介绍
      flow.push({
        part: 'Part 1 · 自我介绍', seconds: 20, prep: 0, kind: 'intro', capture: true,
        aiText: pick(Q.intros).text,
        keywords: ['introduce', 'name', 'major', 'hobby', 'hometown', 'like', 'study'],
      });
      // Part 2 短文朗读
      const passage = pick(DATA.READING_PASSAGES);
      flow.push({
        part: 'Part 2 · 短文朗读', seconds: 60, prep: 45, kind: 'reading', capture: true,
        passage: passage, aiText: 'Now let us move to Part 2, reading aloud. Here is a short passage. You will have 45 seconds to prepare, then one minute to read it aloud. Please begin when you are ready.',
        keywords: [],
      });
      // Part 3 简短回答（与短文相关 2 题）
      const passageQs = (passage.questions || []).slice(0, 2);
      flow.push({
        part: 'Part 3 · 简短回答', seconds: 40, prep: 0, kind: 'qa', capture: true,
        qas: passageQs.map((q) => ({ q, followUps: ['Could you explain that a little more?', 'Anything else you would like to add?'] })),
        aiText: 'Now I will ask you two questions about the passage. You have about 40 seconds for each question.',
        keywords: [],
      });
      // Part 4 个人陈述
      const st = pick(mode === '模拟' ? Q.statements.filter((s) => !s.real) : Q.statements);
      flow.push({
        part: 'Part 4 · 个人陈述', seconds: 60, prep: 45, kind: 'statement', capture: true,
        prompt: st.prompt, keywords: st.keywords, topic: st.topic,
        aiText: 'Next is the individual statement task. You will have 45 seconds to prepare and then one minute to speak.',
      });
      // Part 5 两人互动
      const ds = pick(mode === '模拟' ? Q.discussions.filter((d) => !d.real) : Q.discussions);
      flow.push({
        part: 'Part 5 · 两人互动', seconds: 180, prep: 60, kind: 'discussion', capture: true,
        scenario: ds.scenario, partnerOpen: ds.partnerOpen, keywords: ds.keywords, topic: ds.topic,
        aiText: 'Finally, let us have a discussion task. The situation is: ' + ds.scenario + ' You will have one minute to prepare, then discuss with your partner for about three minutes.',
      });
    } else {
      // CET6
      flow.push({
        part: 'Part 1 · 自我介绍和问答', seconds: 30, prep: 0, kind: 'intro', capture: true,
        aiText: pick(Q.intros).text,
        keywords: ['introduce', 'name', 'major', 'study', 'interest', 'hobby'],
      });
      const qaBank = mode === '模拟' ? Q.qa.filter((x) => !x.real) : Q.qa;
      const qaItems = shuffle(qaBank).slice(0, 2).map((it) => it);
      flow.push({
        part: 'Part 1 · 问答', seconds: 30, prep: 0, kind: 'qa', capture: true,
        qas: qaItems.map((it) => ({ q: it.text, followUps: it.followUps, keywords: it.keywords, topic: it.topic })),
        aiText: 'Thank you. Now I would like to ask you a few questions.',
        keywords: [],
      });
      const st = pick(mode === '模拟' ? Q.statements.filter((s) => !s.real) : Q.statements);
      flow.push({
        part: 'Part 2 · 陈述和讨论', seconds: 90, prep: 60, kind: 'statement', capture: true,
        prompt: st.prompt, keywords: st.keywords, topic: st.topic,
        aiText: 'Now for the presentation task. Your topic is: ' + st.prompt + ' You will have one minute to prepare and ninety seconds to present.',
      });
      const ds = pick(mode === '模拟' ? Q.discussions.filter((d) => !d.real) : Q.discussions);
      flow.push({
        part: 'Part 2 · 讨论', seconds: 180, prep: 0, kind: 'discussion', capture: true,
        scenario: ds.scenario, partnerOpen: ds.partnerOpen, keywords: ds.keywords, topic: ds.topic,
        aiText: 'Now let us discuss together on the topic: ' + ds.scenario + ' I will start.',
      });
      const finalQ = pick(mode === '模拟' ? Q.qa.filter((x) => !x.real) : Q.qa);
      flow.push({
        part: 'Part 3 · 问答', seconds: 60, prep: 0, kind: 'qa', capture: true,
        qas: [{ q: finalQ.text, followUps: ['Could you give an example?', 'And what about your own experience?'], keywords: finalQ.keywords, topic: finalQ.topic }],
        aiText: 'Thank you. One last question to finish our interview.',
        keywords: [],
      });
    }
    return flow;
  }

  /* ---------------- 面试引擎 ---------------- */
  let engine = null;

  class Interview {
    constructor(cfg) {
      this.level = cfg.level;
      this.mode = cfg.mode;
      this.onEvent = cfg.onEvent || function () {};
      this.flow = buildFlow(cfg.level, cfg.mode);
      this.stepIdx = -1;
      this.usingApi = !!(getSettings().apiKey);
      this.apiFailed = false;
      this.answers = [];          // {role:'user', text, keywords, step, seconds}
      this.transcript = [];       // {role, name, text, time}
      this.timers = [];
      this.sttHandle = null;
      this.busyLine = null;
      this.ended = false;
      this.turnNo = 0;
      this.historyBase = [];
      this.autoAdvance = true;
      this.secondsLeft = 0;
      this.inPrep = false;
      this.prepResolve = null;
      this.prepSecLeft = 0;
    }

    emit(type, payload) { try { this.onEvent(type, payload); } catch (e) { /* ignore */ } }

    log(name, text, meta) {
      this.transcript.push({ role: name === '你' ? 'user' : 'assistant', name, text: text || '', time: new Date().toLocaleTimeString('zh-CN', { hour12: false }), meta: meta || {} });
      this.emit('line', { name, text, meta: meta || {} });
    }

    clearTimers() { this.timers.forEach((t) => clearInterval(t)); this.timers = []; }

    start() {
      this.emit('system', { text: '考试开始。请尽量用英语回答，像真实考试一样。' });
      this.stepIdx = -1;
      this.nextStep();
    }

    nextStep() {
      if (this.ended) return;
      this.stepIdx++;
      if (this.stepIdx >= this.flow.length) { this.finish(); return; }
      this.runStep(this.flow[this.stepIdx]);
    }

    emitterTimer(sec, onTick, onEnd) {
      let left = sec;
      const id = setInterval(() => {
        left--;
        this.secondsLeft = left;
        onTick && onTick(left);
        if (left <= 0) { clearInterval(id); onEnd && onEnd(); }
      }, 1000);
      this.timers.push(id);
    }

    /* ---- 执行一个环节 ---- */
    runStep(step) {
      this.emit('state', { phase: 'step', step, index: this.stepIdx, usingApi: this.usingApi, apiFailed: this.apiFailed });

      const speakAI = (text) => {
        return new Promise((resolve) => {
          this.log('考官', text);
          this.emit('phase', { name: 'ai-speaking', label: '考官说话…' });
          VOICE.speak(text, { rate: 0.98 }).then(() => setTimeout(resolve, 350));
        });
      };

      const doPrep = (sec) => {
        return new Promise((resolve) => {
          if (!sec) return resolve();
          this.inPrep = true;
          this.prepResolve = resolve;
          this.emit('phase', { name: 'prep', label: '准备中…（可随时点“开始作答”跳过）', seconds: sec });
          this.emit('prep', { seconds: sec });
          this.emitterTimer(sec, (l) => { this.prepSecLeft = l; this.emit('prep', { seconds: l }); }, () => {
            this.inPrep = false;
            this.prepResolve = null;
            this.emit('prep', { seconds: 0 });
            resolve();
          });
        });
      };

      const collectAnswer = (keywords, seconds, label) => {
        return new Promise((resolve) => {
          const handle = {
            text: '',
            finished: false,
            stt: null,
            finish: null,
          };
          this.busyCollect = handle;
          handle.finish = (forcedText) => {
            if (handle.finished) return;
            handle.finished = true;
            if (typeof forcedText === 'string') handle.text = forcedText;
            if (handle.stt) { try { handle.stt.stop(); } catch (e) {} }
            this.emit('speak', { active: false, listening: false });
            resolve(handle.text);
          };
          this.emit('phase', { name: 'speak', label: label || '请作答…', seconds: seconds });
          this.emit('speak', { seconds, active: true, listening: true });

          // 倒计时
          this.emitterTimer(seconds, (l) => this.emit('speak', { seconds: l, active: true, listening: !handle.finished }), () => {
            handle.finish();
          });

          // 语音识别
          if (VOICE.sttAvailable()) {
            handle.stt = VOICE.listen({
              lang: 'en-US',
              interim: (txt) => { if (!handle.finished) { handle.text = txt; this.emit('interim', txt); } },
              onFinalRaw: (txt) => { if (!handle.finished) { handle.text = txt; handle.gotFinal = true; } },
              onError: (err) => {
                this.emit('sysnote', { text: '⚠️ ' + err.message + '——若无法使用麦克风，请在下方输入框直接打字回答。', kind: 'warn' });
                this.emit('speak', { listening: false });
              },
              onEnd: (r) => {
                if (handle.finished) return;
                if (r && r.final) handle.text = r.final;
                // 已捕捉到有效语音 → 短停后自动进入下一步（像真实对话的停顿）
                if (handle.gotFinal || (r && r.final)) {
                  setTimeout(() => { handle.finish(); }, 900);
                }
              },
            });
          } else {
            this.emit('sysnote', { text: '⚠️ 当前浏览器不支持语音识别，请用下方输入框打字回答。（电脑端推荐使用 Edge/Chrome）', kind: 'warn' });
          }
        });
      };

      const pushAnswer = (step_, text) => {
        this.answers.push({ text: text || '', keywords: step_.keywords || [], step: step_.part, seconds: this.secondsLeft });
        this.log('你', text || '（未作答/无法识别）', { answered: !!text });
      };

      const next = () => { this.clearTimers(); this.nextStep(); };

      /* ---------- 分环节执行 ---------- */
      const run = (async () => {
        await speakAI(step.aiText);
        if (step.kind === 'reading') {
          this.emit('reading', { passage: step.passage });
          await doPrep(step.prep);
          this.emit('phase', { name: 'speak', label: '请朗读短文…', seconds: step.seconds });
          this.emit('speak', { seconds: step.seconds, active: true, listening: true, reading: true });
          await collectAnswer([], step.seconds, '请朗读短文…');
          pushAnswer(step, this.lastAnswerText());
          // 朗读不逐字点评，快速进入下一部分
          await this.tryReaction('Thank you. That will be all for the reading part.');
          next();
        } else if (step.kind === 'qa') {
          for (let i = 0; i < step.qas.length; i++) {
            const item = step.qas[i];
            await speakAI(item.q);
            if (step.prep) await doPrep(step.prep);
            await collectAnswer(item.keywords || [], step.seconds, step.seconds + '秒作答…');
            pushAnswer({ ...step, keywords: item.keywords || [] }, this.lastAnswerText());
            // 自然追问（API 或 脚本）
            const followUp = await this.followUpLine(item, i, step.qas.length);
            if (followUp) {
              await speakAI(followUp);
              await collectAnswer(item.keywords || [], Math.min(30, step.seconds), '追问作答…');
              pushAnswer({ ...step, keywords: item.keywords || [] }, this.lastAnswerText());
            }
          }
          next();
        } else if (step.kind === 'statement') {
          this.emit('prompt', { prompt: step.prompt, topic: step.topic });
          await doPrep(step.prep);
          await collectAnswer(step.keywords || [], step.seconds, '请在规定时间内陈述…');
          pushAnswer(step, this.lastAnswerText());
          await this.tryReaction('Thank you. That was a very clear statement.');
          next();
        } else if (step.kind === 'discussion') {
          this.emit('prompt', { scenario: step.scenario, topic: step.topic });
          await doPrep(step.prep);
          // partner 开场
          await speakAI(step.partnerOpen);
          await collectAnswer(step.keywords || [], Math.min(90, step.seconds), '请回应你的同伴…');
          pushAnswer(step, this.lastAnswerText());
          // 两轮来回
          for (let r = 0; r < 2; r++) {
            const reply = await this.partnerReply(step, r);
            if (!reply) break;
            await speakAI(reply);
            await collectAnswer(step.keywords || [], Math.min(60, step.seconds), '继续讨论…');
            pushAnswer(step, this.lastAnswerText());
          }
          await this.tryReaction('Well, we have covered a lot of ground. Thank you for the discussion.');
          next();
        } else {
          // intro
          await collectAnswer(step.keywords || [], step.seconds, step.seconds + '秒作答…');
          pushAnswer(step, this.lastAnswerText());
          await this.tryReaction('Thank you. Nice to meet you.');
          next();
        }
      })();
      run.catch((e) => {
        console.error(e);
        this.emit('sysnote', { text: '⚠️ 环节运行出错：' + e.message, kind: 'error' });
        next();
      });
    }

    /* 回答结束时的 AI 反应（失败时用脚本兜底） */
    async tryReaction(fallback) {
      const last = this.answers[this.answers.length - 1];
      if (!this.usingApi || this.apiFailed || !last || !last.text) {
        this.log('考官', fallback);
        await VOICE.speak(fallback, { rate: 0.98 });
        return;
      }
      try {
        const cont = await this.askForLine('Briefly react to the candidate\'s last answer (1 sentence, acknowledge it). Do not ask a new question now.');
        this.log('考官', cont);
        await VOICE.speak(cont, { rate: 0.98 });
      } catch (e) {
        this.markApiFail(e);
        this.log('考官', fallback);
        await VOICE.speak(fallback, { rate: 0.98 });
      }
    }

    /* 记录API失败并降级本地模式 */
    markApiFail(e) {
      if (!this.apiFailed) {
        this.apiFailed = true;
        this.usingApi = false;
        this.emit('sysnote', { text: '⚠️ 智能考官连接失败，已自动切换为本地模式继续考试：' + e.message, kind: 'warn' });
      }
    }

    /* 追问生成 */
    async followUpLine(item, idx, total) {
      const last = this.answers[this.answers.length - 1];
      if (total === 1 || idx !== total - 1) {
        if (idx < total - 1) return null; // 还有下一题，直接问下一题
      }
      if (!this.usingApi || this.apiFailed) {
        // 脚本追问
        if (item.followUps && item.followUps.length) {
          return item.followUps[Math.min(idx, item.followUps.length - 1)];
        }
        return null;
      }
      if (!last || !last.text) return null;
      try {
        const line = await this.askForLine('The candidate just answered: "' + last.text + '". Ask ONE short natural follow-up question related to their answer (1 sentence only).');
        return line;
      } catch (e) { this.markApiFail(e); return item.followUps && item.followUps[0] ? item.followUps[0] : null; }
    }

    /* 双人互动：同伴回复 */
    async partnerReply(step, round) {
      const last = this.answers[this.answers.length - 1];
      if (!this.usingApi || this.apiFailed) {
        const lines = [
          'That is an interesting point. What do you think we should do first to make it happen?',
          'I see. Do you think most students on campus would support this idea? Why?',
        ];
        return lines[Math.min(round, lines.length - 1)];
      }
      if (!last || !last.text) return 'What is your opinion about that?';
      try {
        const line = await this.askForLine('You are now the candidate\'s discussion PARTNER (not the examiner). Situation: ' + step.scenario + ' The candidate just said: "' + last.text + '". Reply as a natural partner: react briefly and keep the discussion going (1-2 sentences, ask one question).');
        return line;
      } catch (e) { this.markApiFail(e); return 'I agree. And do you have any other suggestions?'; }
    }

    /* 调用 LLM 生成考官/同伴的一句话 */
    async askForLine(instruction) {
      const hist = this.transcript.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.text,
      })).filter((m) => m.content && m.content.trim());
      const sys = SYSTEM_PROMPT_BASE + '\nExam level: CET' + this.level + '. Current exam scenario: ' + this.scenarioDesc() + '.\n' + instruction;
      const content = await chatLLM([{ role: 'system', content: sys }, ...hist], { temperature: 0.85, max_tokens: 200 });
      return String(content).trim().replace(/^["']|["']$/g, '');
    }

    scenarioDesc() {
      const step = this.flow[this.stepIdx];
      return step ? step.part : 'interview';
    }

    /* 手动提交文字答案 */
    submitText(text) {
      const handle = this.busyCollect;
      if (!handle || handle.finished) return false;
      handle.finish(text);
      this.emit('interim', text);
      return true;
    }

    /* 提前结束当前作答 */
    endAnswer() {
      const h = this.busyCollect;
      if (h && !h.finished) h.finish();
    }

    /* 跳过准备阶段 */
    skipPrep() {
      if (!this.inPrep || !this.prepResolve) return false;
      this.inPrep = false;
      this.clearTimers();
      this.emit('prep', { seconds: 0 });
      const r = this.prepResolve;
      this.prepResolve = null;
      r();
      return true;
    }

    lastAnswerText() {
      return this.busyCollect ? (this.busyCollect.text || '') : '';
    }

    /* 结束考试 → 评分 */
    finish() {
      if (this.ended) return;
      this.ended = true;
      this.clearTimers();
      if (this.busyCollect && this.busyCollect.stt) { try { this.busyCollect.stt.abort(); } catch (e) {} }
      this.emit('phase', { name: 'scoring', label: '考官评分中…' });
      this.emit('state', { phase: 'scoring' });
      this.evaluate()
        .then((score) => {
          this.emit('result', score);
        })
        .catch((e) => {
          const score = localScore(this.answers, {});
          this.emit('sysnote', { text: '⚠️ 智能评分失败，已改用本地估分：' + e.message, kind: 'warn' });
          this.emit('result', score);
        });
    }

    async evaluate() {
      if (!this.usingApi || this.apiFailed) {
        return localScore(this.answers, {});
      }
      const hist = this.transcript.map((m) => ({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text }));
      const sys =
        'You are an experienced CET-SET speaking examiner. Below is the transcript of a CET' + this.level + ' mock interview. ' +
        'Evaluate the CANDIDATE on six dimensions, each 0-5 (use one decimal): content(切题与内容完整), fluency(流畅度), vocabulary(词汇), grammar(语法), pronunciation(语音语调,estimate from wording only and note this), interaction(互动交际). ' +
        'Respond with VALID JSON ONLY, no markdown, exactly this shape: ' +
        '{"dimensions":{"content":4.2,"fluency":3.5,"vocabulary":3.8,"grammar":3.6,"pronunciation":3.5,"interaction":4.0},"comments":{"content":"...","fluency":"...","vocabulary":"...","grammar":"...","pronunciation":"...","interaction":"..."},"advice":"给考生的3条英文改进建议，用中文1条总结","total":3.8} ' +
        'total is the average. In comments use Chinese. Be concrete and specific to what the candidate actually said.';
      const prompt = 'Exam level: CET' + this.level + '. Please evaluate the following transcript:\n\n' +
        this.transcript.map((m) => (m.role === 'user' ? '[考生] ' : '[考官] ') + m.text).join('\n');
      const content = await chatLLM([
        { role: 'system', content: sys },
        { role: 'user', content: prompt },
      ], { temperature: 0.3, max_tokens: 1200, model_force: 1 });
      const obj = extractJSON(content);
      if (!obj || !obj.dimensions) throw new Error('评分格式解析失败');
      const D = obj.dimensions;
      const total = typeof obj.total === 'number' ? obj.total : (Object.keys(D).reduce((s, k) => s + Number(D[k] || 0), 0) / Math.max(1, Object.keys(D).length));
      const rounded = Math.round(total * 10) / 10;
      return {
        engine: 'api',
        dimensions: {
          content: Number(D.content) || 0,
          fluency: Number(D.fluency) || 0,
          vocabulary: Number(D.vocabulary) || 0,
          grammar: Number(D.grammar) || 0,
          pronunciation: Number(D.pronunciation) || 0,
          interaction: Number(D.interaction) || 0,
        },
        comments: obj.comments || {},
        advice: obj.advice || '',
        total: rounded,
        grade: gradeFor(rounded),
        rawReview: content,
      };
    }

    stop() {
      this.ended = true;
      this.clearTimers();
      if (this.busyCollect && this.busyCollect.stt) { try { this.busyCollect.stt.abort(); } catch (e) {} }
      VOICE.stopSpeaking();
      this.emit('state', { phase: 'stopped' });
    }
  }

  return {
    start(cfg) {
      if (engine) engine.stop();
      engine = new Interview(cfg);
      engine.start();
      return engine;
    },
    getEngine() { return engine; },
    stop() { if (engine) engine.stop(); },
    localScore,
    gradeFor,
  };
})();