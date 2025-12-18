// Popup 控制脚本
let isScrolling = false;

document.addEventListener('DOMContentLoaded', async () => {
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusEl = document.getElementById('status');
  const sessionCountEl = document.getElementById('sessionCount');
  const progressEl = document.getElementById('progress');
  const scrollIntervalInput = document.getElementById('scrollInterval');
  const maxScrollsInput = document.getElementById('maxScrolls');
  const skipExistingInput = document.getElementById('skipExisting');

  // 从 storage 恢复状态和设置
  const stored = await chrome.storage.local.get(['isScrolling', 'sessionCount', 'scrollCount', 'skipExisting']);
  
  // 恢复 skipExisting 设置（默认 true）
  skipExistingInput.checked = stored.skipExisting !== false;
  if (stored.isScrolling) {
    isScrolling = true;
    updateUI(true);
  }
  if (stored.sessionCount) {
    sessionCountEl.textContent = stored.sessionCount + ' 条';
  }

  // 监听状态更新
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.sessionCount) {
      sessionCountEl.textContent = changes.sessionCount.newValue + ' 条';
    }
    if (changes.scrollCount) {
      const max = parseInt(maxScrollsInput.value);
      progressEl.textContent = `已滚动 ${changes.scrollCount.newValue} / ${max} 次`;
    }
    if (changes.isScrolling) {
      isScrolling = changes.isScrolling.newValue;
      updateUI(isScrolling);
    }
  });

  startBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url?.includes('x.com') && !tab.url?.includes('twitter.com')) {
      alert('请先打开 X/Twitter 页面！');
      return;
    }

    const interval = parseInt(scrollIntervalInput.value) || 1500;
    const maxScrolls = parseInt(maxScrollsInput.value) || 100;
    const skipExisting = skipExistingInput.checked;

    // 检测当前页面的 source 类型
    const source = detectSource(tab.url);
    statusEl.textContent = '⏳ 加载已有数据...';

    // 如果开启跳过，先加载已有 ID
    if (skipExisting && source !== 'unknown') {
      const result = await chrome.runtime.sendMessage({ 
        type: 'LOAD_EXISTING_IDS', 
        source: source 
      });
      console.log('[popup] 已加载', result?.count || 0, '个已有 ID');
    }

    // 保存设置并重置计数
    await chrome.storage.local.set({ 
      isScrolling: true, 
      sessionCount: 0,
      scrollCount: 0,
      skipExisting: skipExisting
    });

    // 注入自动滚动脚本
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: startAutoScroll,
      args: [interval, maxScrolls]
    });

    updateUI(true);
  });

  stopBtn.addEventListener('click', async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    await chrome.storage.local.set({ isScrolling: false });

    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: stopAutoScroll
    });

    updateUI(false);
  });

  function updateUI(scrolling) {
    const statusEl = document.getElementById('status');
    if (scrolling) {
      startBtn.style.display = 'none';
      stopBtn.style.display = 'block';
      statusEl.textContent = '🔄 滚动中...';
      statusEl.style.color = '#00ba7c';
    } else {
      startBtn.style.display = 'block';
      stopBtn.style.display = 'none';
      statusEl.textContent = '待机中';
      statusEl.style.color = '#888';
    }
  }

  // 根据 URL 检测 source 类型
  function detectSource(url) {
    if (!url) return 'unknown';
    if (url.includes('/likes')) return 'likes';
    if (url.includes('/i/bookmarks')) return 'bookmarks';
    // 个人主页的推文
    if (url.match(/x\.com\/[^/]+$/) || url.match(/x\.com\/[^/]+\/$/)) return 'my_tweets';
    return 'unknown';
  }

  // 加载缓存状态
  async function loadCacheStatus() {
    const result = await chrome.runtime.sendMessage({ type: 'GET_CACHE_STATUS' });
    if (result?.ok) {
      document.getElementById('cacheLikes').textContent = result.status.likes || 0;
      document.getElementById('cacheBookmarks').textContent = result.status.bookmarks || 0;
      document.getElementById('cacheMyTweets').textContent = result.status.my_tweets || 0;
    }
  }

  // 清除缓存按钮
  document.getElementById('clearCacheBtn').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' });
    await loadCacheStatus();
    alert('缓存已清除！');
  });

  // 初始加载缓存状态
  loadCacheStatus();

  // ========== Token 管理 ==========
  const apiTokenInput = document.getElementById('apiToken');
  const saveTokenBtn = document.getElementById('saveTokenBtn');
  const testTokenBtn = document.getElementById('testTokenBtn');
  const tokenStatusEl = document.getElementById('tokenStatus');

  // 加载已保存的 token
  chrome.storage.local.get(['apiToken'], (data) => {
    if (data.apiToken) {
      apiTokenInput.value = data.apiToken;
      tokenStatusEl.textContent = '✅ Token 已配置';
      tokenStatusEl.style.color = '#00ba7c';
    }
  });

  // 保存 token
  saveTokenBtn.addEventListener('click', async () => {
    const token = apiTokenInput.value.trim();
    if (!token) {
      tokenStatusEl.textContent = '❌ 请输入 Token';
      tokenStatusEl.style.color = '#f4212e';
      return;
    }
    
    await chrome.storage.local.set({ apiToken: token });
    // 通知 background 更新 token
    chrome.runtime.sendMessage({ type: 'UPDATE_TOKEN', token });
    tokenStatusEl.textContent = '✅ Token 已保存';
    tokenStatusEl.style.color = '#00ba7c';
  });

  // 测试 token
  testTokenBtn.addEventListener('click', async () => {
    const token = apiTokenInput.value.trim();
    if (!token) {
      tokenStatusEl.textContent = '❌ 请输入 Token';
      tokenStatusEl.style.color = '#f4212e';
      return;
    }

    tokenStatusEl.textContent = '⏳ 测试中...';
    tokenStatusEl.style.color = '#888';

    const result = await chrome.runtime.sendMessage({ type: 'TEST_TOKEN', token });
    if (result?.ok) {
      tokenStatusEl.textContent = `✅ Token 有效 (用户: ${result.username})`;
      tokenStatusEl.style.color = '#00ba7c';
    } else {
      tokenStatusEl.textContent = `❌ ${result?.error || 'Token 无效'}`;
      tokenStatusEl.style.color = '#f4212e';
    }
  });
});

// 注入到页面的自动滚动函数
function startAutoScroll(interval, maxScrolls) {
  // 防止重复启动
  if (window.__xManagerScrolling) return;
  window.__xManagerScrolling = true;
  window.__xManagerScrollCount = 0;
  window.__xManagerLastHeight = 0;
  window.__xManagerNoChangeCount = 0;

  console.log('[x-libris] 开始自动滚动，间隔:', interval, '最大次数:', maxScrolls);

  // 每抓取一定数量后刷新页面，防止内存爆炸
  const REFRESH_THRESHOLD = 50; // 每 50 次滚动刷新一次页面

  async function doScroll() {
    if (!window.__xManagerScrolling) return;

    window.__xManagerScrollCount++;
    chrome.storage.local.set({ scrollCount: window.__xManagerScrollCount });

    // 每 REFRESH_THRESHOLD 次滚动刷新页面，防止内存爆炸
    if (window.__xManagerScrollCount > 0 && window.__xManagerScrollCount % REFRESH_THRESHOLD === 0) {
      console.log('[x-libris] 达到刷新阈值，刷新页面防止崩溃');
      // 保存当前进度，刷新后继续
      chrome.storage.local.set({ 
        continueScrolling: true,
        remainingScrolls: maxScrolls - window.__xManagerScrollCount,
        scrollInterval: interval
      });
      window.location.reload();
      return;
    }

    // 记录滚动前的高度
    const beforeHeight = document.body.scrollHeight;

    // 直接滚到当前内容底部，触发加载
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });

    console.log('[x-libris] 滚动', window.__xManagerScrollCount, '/', maxScrolls);

    // 等待一下让内容加载
    await new Promise(r => setTimeout(r, interval));

    // 检查是否有新内容加载
    const afterHeight = document.body.scrollHeight;
    if (afterHeight === beforeHeight) {
      window.__xManagerNoChangeCount++;
      console.log('[x-libris] 页面高度未变化，连续', window.__xManagerNoChangeCount, '次');
    } else {
      window.__xManagerNoChangeCount = 0;
    }

    // 停止条件：达到最大次数 或 连续5次没有新内容
    if (window.__xManagerScrollCount >= maxScrolls || window.__xManagerNoChangeCount >= 5) {
      console.log('[x-libris] 滚动完成！原因:', 
        window.__xManagerNoChangeCount >= 5 ? '已到底部(无新内容)' : '达到最大次数');
      window.__xManagerScrolling = false;
      chrome.storage.local.set({ isScrolling: false });
      return;
    }

    // 继续下一次滚动
    if (window.__xManagerScrolling) {
      setTimeout(doScroll, 500);
    }
  }

  doScroll();
}

function stopAutoScroll() {
  console.log('[x-libris] 停止自动滚动');
  window.__xManagerScrolling = false;
  if (window.__xManagerScrollTimer) {
    clearInterval(window.__xManagerScrollTimer);
  }
}
