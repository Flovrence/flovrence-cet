// Cloudflare Worker：免费 AI 代理（用于 GitHub Pages 等静态托管的完整 AI 功能）
// 部署：打开 https://workers.cloudflare.com → 在线编辑器粘贴本文件 → Deploy
// 得到 https://你的名字.workers.dev 地址 → 填进 js/config.js 的 window.CET_API_BASE
// 原理：把浏览器发来的 { apiKey, messages, model } 转发给 DeepSeek 官方接口。
// 安全：Key 由每位用户在自己的浏览器里填写，本代理不保存任何 Key。

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'POST') return json({ error: 'Method Not Allowed' }, 405);
    let payload;
    try { payload = await request.json(); } catch { return json({ error: '请求体不是合法 JSON' }, 400); }
    const apiKey = String(payload.apiKey || '').trim();
    if (!apiKey) return json({ error: '缺少 API Key' }, 400);
    if (!Array.isArray(payload.messages)) return json({ error: '缺少 messages' }, 400);
    try {
      const r = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + apiKey },
        body: JSON.stringify({
          model: payload.model || 'deepseek-chat',
          messages: payload.messages,
          temperature: typeof payload.temperature === 'number' ? payload.temperature : 0.7,
          max_tokens: typeof payload.max_tokens === 'number' ? payload.max_tokens : 1200,
          stream: false,
        }),
      });
      const text = await r.text();
      return new Response(text, { status: r.status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' } });
    } catch (e) {
      return json({ error: '无法连接 DeepSeek：' + e.message }, 502);
    }
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' } });
}
