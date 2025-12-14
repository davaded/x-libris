// background service worker（MV3）
console.log('[x-libris:background] Service worker started');

const API_BASE = 'http://localhost:3000/api';
const API_KEY = 'secret-api-key-123';

// ========== 已抓取 ID 缓存 ==========
// 格式: { likes: Set, bookmarks: Set, my_tweets: Set }
const cachedIds = {
  likes: new Set(),
  bookmarks: new Set(),
  my_tweets: new Set()
};

// 从后端加载已有 ID
async function loadExistingIds(source) {
  try {
    console.log('[x-libris:background] 加载已有 ID，source:', source);
    const res = await fetch(`${API_BASE}/tweets/ids?source=${source}`);
    const data = await res.json();
    
    if (data.ids && Array.isArray(data.ids)) {
      cachedIds[source] = new Set(data.ids);
      console.log('[x-libris:background] 已加载', data.ids.length, '个 ID');
      return data.ids.length;
    }
    return 0;
  } catch (e) {
    console.error('[x-libris:background] 加载 ID 失败:', e.message);
    return 0;
  }
}

// 过滤掉已存在的推文
function filterNewTweets(tweets, source) {
  // 确保 source 有对应的缓存
  if (!cachedIds[source]) {
    cachedIds[source] = new Set();
  }
  
  const existingSet = cachedIds[source];
  const newTweets = tweets.filter(t => !existingSet.has(t.id));
  const skipped = tweets.length - newTweets.length;
  
  // 把新的 ID 加入缓存
  newTweets.forEach(t => existingSet.add(t.id));
  
  console.log('[x-libris:background] 过滤: source=', source, '总共', tweets.length, '新增', newTweets.length, '跳过', skipped);
  return { newTweets, skipped };
}

// ========== 消息处理 ==========
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 加载已有 ID
  if (message.type === 'LOAD_EXISTING_IDS') {
    loadExistingIds(message.source).then(count => {
      sendResponse({ ok: true, count });
    });
    return true;
  }

  // 获取缓存状态
  if (message.type === 'GET_CACHE_STATUS') {
    const status = {
      likes: cachedIds.likes.size,
      bookmarks: cachedIds.bookmarks.size,
      my_tweets: cachedIds.my_tweets.size
    };
    sendResponse({ ok: true, status });
    return true;
  }

  // 清除缓存
  if (message.type === 'CLEAR_CACHE') {
    const source = message.source;
    if (source && cachedIds[source]) {
      cachedIds[source].clear();
    } else {
      Object.keys(cachedIds).forEach(k => cachedIds[k].clear());
    }
    sendResponse({ ok: true });
    return true;
  }

  // 导入数据
  if (message.type === 'IMPORT_X_DATA') {
    handleImport(message, sendResponse);
    return true; // 保持消息通道
  }

  return false;
});

// 异步处理导入
async function handleImport(message, sendResponse) {
  try {
    const payload = message.payload;
    const source = payload.source || 'unknown';
    const skipExisting = payload.skipExisting !== false;
    const tweetCount = payload.parsed?.length || 0;

    console.log('[x-libris:background] 处理导入, source:', source, 'skipExisting:', skipExisting, '推文数:', tweetCount);
    console.log('[x-libris:background] 当前缓存大小:', cachedIds[source]?.size || 0);

    let tweetsToSend = payload.parsed || [];
    let skippedByCache = 0;

    // 在扩展端过滤
    if (skipExisting && tweetsToSend.length > 0) {
      const result = filterNewTweets(tweetsToSend, source);
      tweetsToSend = result.newTweets;
      skippedByCache = result.skipped;
    }

    // 如果全部跳过，直接返回
    if (tweetsToSend.length === 0) {
      console.log('[x-libris:background] 全部跳过，无需请求后端');
      sendResponse({ ok: true, count: 0, skipped: skippedByCache });
      return;
    }

    // 发送到后端
    const res = await fetch(`${API_BASE}/import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY
      },
      body: JSON.stringify({
        ...payload,
        parsed: tweetsToSend
      })
    });

    const text = await res.text();
    console.log('[x-libris:background] API 响应:', text.slice(0, 200));
    
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error('[x-libris:background] JSON 解析失败:', e.message);
      sendResponse({ ok: false, error: 'Invalid JSON: ' + text.slice(0, 100) });
      return;
    }
    
    const totalSkipped = skippedByCache + (data.skipped || 0);
    
    console.log('[x-libris:background] 导入完成, count:', data.count, 'skipped:', totalSkipped);
    
    sendResponse({ 
      ok: true, 
      count: data.count || 0, 
      skipped: totalSkipped 
    });
  } catch (err) {
    console.error('[x-libris:background] Import failed:', err);
    sendResponse({ ok: false, error: err.message || String(err) });
  }
}

console.log('[x-libris:background] Message listener installed');
