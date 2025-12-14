console.log('[x-libris:content] Content script loaded');

// 检查是否需要继续滚动（页面刷新后）
chrome.storage.local.get(['continueScrolling', 'remainingScrolls', 'scrollInterval'], (data) => {
  if (data.continueScrolling && data.remainingScrolls > 0) {
    console.log('[x-libris:content] 检测到需要继续滚动，剩余:', data.remainingScrolls);
    
    // 清除标记
    chrome.storage.local.set({ continueScrolling: false });
    
    // 等待页面加载完成后继续滚动
    setTimeout(() => {
      // 通过 executeScript 注入滚动函数会在 popup 里处理
      // 这里只是提示用户
      console.log('[x-libris:content] 页面已刷新，请重新点击开始按钮继续');
    }, 3000);
  }
});

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

  // 防重复：只用第一条推文的 ID 做去重（更轻量）
  const firstTweetId = event.data.payload?.parsed?.[0]?.id;
  if (!firstTweetId) {
    console.log('[x-libris:content] No tweet ID found, skipping');
    return;
  }
  
  if (processedMessages.has(firstTweetId)) {
    console.log('[x-libris:content] Skipping duplicate batch:', firstTweetId);
    return;
  }
  processedMessages.add(firstTweetId);

  // 限制 Set 大小（更小）
  if (processedMessages.size > 50) {
    const first = processedMessages.values().next().value;
    processedMessages.delete(first);
  }

  console.log('[x-libris:content] Sending to background script');

  // 获取 skipExisting 设置
  chrome.storage.local.get(['skipExisting'], (settings) => {
    const skipExisting = settings.skipExisting !== false; // 默认 true
    
    chrome.runtime.sendMessage({
      type: 'IMPORT_X_DATA',
      payload: {
        ...event.data.payload,
        skipExisting: skipExisting
      }
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

      // 更新抓取计数 - 使用后端返回的实际新增数量
      const newCount = response.count || 0;
      const skipped = response.skipped || 0;
      if (newCount > 0 || skipped > 0) {
        chrome.storage.local.get(['sessionCount'], (result) => {
          const total = (result.sessionCount || 0) + newCount;
          chrome.storage.local.set({ sessionCount: total });
          console.log('[x-libris:content] 新增:', newCount, '跳过:', skipped, '总计:', total);
        });
      }

      console.log('[x-libris:content] Import success!');
    });
  });
});

console.log('[x-libris:content] Message listener installed');
