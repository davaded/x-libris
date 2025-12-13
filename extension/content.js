console.log('[x-libris:content] Content script loaded');

// 注入页面脚本（跑在 page context）
const script = document.createElement('script');
script.src = chrome.runtime.getURL('injected.js');
script.onload = () => {
  console.log('[x-libris:content] injected.js loaded and removed');
  script.remove();
};
script.onerror = (e) => {
  console.error('[x-libris:content] Failed to load injected.js:', e);
};
(document.head || document.documentElement).appendChild(script);

// ========== 防重复 ==========
const processedMessages = new Set();

// 接收 injected.js 传回的数据
window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  if (!event.data || event.data.type !== 'X_LIBRIS_DATA') return;

  console.log('[x-libris:content] Received X_LIBRIS_DATA from injected.js');
  console.log('[x-libris:content] Payload keys:', Object.keys(event.data.payload || {}));

  // 防重复：用 payload 的简单 hash 做去重
  const payloadKey = JSON.stringify(event.data.payload).slice(0, 200);
  if (processedMessages.has(payloadKey)) {
    console.log('[x-libris:content] Skipping duplicate message');
    return;
  }
  processedMessages.add(payloadKey);

  // 限制 Set 大小
  if (processedMessages.size > 100) {
    const first = processedMessages.values().next().value;
    processedMessages.delete(first);
  }

  console.log('[x-libris:content] Sending to background script');

  chrome.runtime.sendMessage({
    type: 'IMPORT_X_DATA',
    payload: event.data.payload
  }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[x-libris:content] Message send failed:', chrome.runtime.lastError.message);
      return;
    }

    console.log('[x-libris:content] Background response:', response);

    if (!response || !response.ok) {
      console.warn('[x-libris:content] Import failed:', response?.error || 'Unknown error');
      return;
    }

    console.log('[x-libris:content] Import success!');
  });
});

console.log('[x-libris:content] Message listener installed');
