// background service worker（MV3）
console.log('[x-libris:background] Service worker started');

const API_BASE = 'http://localhost:3000/api';

// 动态获取用户配置的 token
async function getApiToken() {
  const data = await chrome.storage.local.get(['apiToken']);
  return data.apiToken || '';
}

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
    const token = await getApiToken();
    
    const headers = {};
    if (token) {
      headers['x-extension-token'] = token;
    }
    
    const res = await fetch(`${API_BASE}/tweets/ids?source=${source}`, { headers });
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

  // 更新 token
  if (message.type === 'UPDATE_TOKEN') {
    console.log('[x-libris:background] Token 已更新');
    sendResponse({ ok: true });
    return true;
  }

  // 测试 token
  if (message.type === 'TEST_TOKEN') {
    testToken(message.token).then(result => sendResponse(result));
    return true;
  }

  return false;
});

// 测试 token 是否有效
async function testToken(token) {
  try {
    const res = await fetch(`${API_BASE}/tokens/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-extension-token': token
      }
    });
    
    if (res.ok) {
      const data = await res.json();
      return { ok: true, username: data.username };
    } else {
      return { ok: false, error: 'Token 无效' };
    }
  } catch (e) {
    return { ok: false, error: '连接失败: ' + e.message };
  }
}

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

    // 逐条发送到后端（API 期望单条格式）
    let successCount = 0;
    let failCount = 0;

    for (const tweet of tweetsToSend) {
      try {
        // 转换字段格式以匹配 ImportTweetPayload
        const importPayload = {
          id: tweet.id,
          url: tweet.url,
          content: tweet.text,
          authorName: tweet.author?.name || '',
          authorHandle: tweet.author?.screen_name || '',
          authorAvatar: tweet.author?.avatar,
          mediaUrls: tweet.media?.map(m => m.url) || [],
          hashtags: tweet.hashtags || [],
          replyCount: tweet.metrics?.replies || 0,
          retweetCount: tweet.metrics?.retweets || 0,
          likeCount: tweet.metrics?.likes || 0,
          quoteCount: 0,
          folder: 'Unsorted',
          source: source,
          tweetedAt: tweet.created_at
        };

        const token = await getApiToken();
        if (!token) {
          console.error('[x-libris:background] 未配置 API Token');
          sendResponse({ ok: false, error: '请先配置 API Token' });
          return;
        }

        const res = await fetch(`${API_BASE}/import`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-extension-token': token
          },
          body: JSON.stringify(importPayload)
        });

        if (res.ok) {
          successCount++;
        } else {
          failCount++;
          const errText = await res.text();
          console.warn('[x-libris:background] 导入失败:', tweet.id, errText.slice(0, 100));
        }
      } catch (e) {
        failCount++;
        console.error('[x-libris:background] 导入异常:', tweet.id, e.message);
      }
    }

    console.log('[x-libris:background] 导入完成, 成功:', successCount, '失败:', failCount, '跳过:', skippedByCache);
    
    sendResponse({ 
      ok: true, 
      count: successCount, 
      skipped: skippedByCache,
      failed: failCount
    });
  } catch (err) {
    console.error('[x-libris:background] Import failed:', err);
    sendResponse({ ok: false, error: err.message || String(err) });
  }
}

console.log('[x-libris:background] Message listener installed');
