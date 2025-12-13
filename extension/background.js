// background service worker（MV3）
console.log('[x-libris:background] Service worker started');

const API_URL = 'http://localhost:3000/api/import';
const API_KEY = 'secret-api-key-123';

// ========== 工具函数 ==========
function safeJsonParse(text) {
  if (!text) {
    console.log('[x-libris:background] safeJsonParse: empty text');
    return null;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    console.warn('[x-libris:background] JSON parse failed:', e.message, 'text preview:', text.slice(0, 100));
    return null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[x-libris:background] Received message:', message.type);
  
  if (message.type !== 'IMPORT_X_DATA') {
    console.log('[x-libris:background] Ignoring non-IMPORT message');
    return;
  }

  console.log('[x-libris:background] Processing IMPORT_X_DATA');
  console.log('[x-libris:background] Payload keys:', Object.keys(message.payload || {}));

  fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY
    },
    body: JSON.stringify(message.payload)
  })
    .then(async (res) => {
      console.log('[x-libris:background] API response status:', res.status);
      console.log('[x-libris:background] API response headers:', res.headers.get('content-type'));

      const text = await res.text();
      console.log('[x-libris:background] API response text length:', text?.length);
      console.log('[x-libris:background] API response preview:', text?.slice(0, 200));

      if (!text) {
        console.warn('[x-libris:background] Empty response body');
        return { ok: false, error: 'Empty response' };
      }

      const data = safeJsonParse(text);

      if (!data) {
        console.warn('[x-libris:background] Invalid JSON response');
        return { ok: false, error: 'Invalid JSON response' };
      }

      console.log('[x-libris:background] Import success, data:', data);
      return { ok: true, data };
    })
    .then((result) => {
      console.log('[x-libris:background] Sending response to content:', result);
      sendResponse(result);
    })
    .catch((err) => {
      console.error('[x-libris:background] Import failed:', err.message);
      sendResponse({ ok: false, error: err.message });
    });

  // 保持消息通道
  return true;
});

console.log('[x-libris:background] Message listener installed');
