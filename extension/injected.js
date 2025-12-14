(() => {
  console.log('[x-libris:injected] Script loaded');

  // ========== 工具函数 ==========
  function safeJsonParse(text) {
    if (!text) {
      console.log('[x-libris:injected] safeJsonParse: empty text');
      return null;
    }
    try {
      return JSON.parse(text);
    } catch (e) {
      console.warn('[x-libris:injected] JSON parse failed:', e.message, 'text preview:', text.slice(0, 100));
      return null;
    }
  }

  // 匹配目标 API：用户推文、收藏、喜欢
  const isTarget = (url) =>
    url &&
    url.includes('graphql') &&
    /bookmark|usertweet|likes/i.test(url);

  // 根据 URL 判断来源类型
  function getSourceType(url) {
    if (!url) return 'unknown';
    if (/usertweet/i.test(url)) return 'my_tweets';
    if (/likes/i.test(url)) return 'likes';
    if (/bookmark/i.test(url)) return 'bookmarks';
    return 'unknown';
  }

  // ========== 解析 Twitter 数据 ==========
  function parseTweets(json) {
    const tweets = [];
    
    try {
      // Twitter GraphQL 返回的数据结构
      // data.user.result.timeline.timeline.instructions[].entries[]
      // 或 data.bookmark_timeline_v2.timeline.instructions[].entries[]
      
      let instructions = null;
      
      // UserTweets 结构
      if (json?.data?.user?.result?.timeline?.timeline?.instructions) {
        instructions = json.data.user.result.timeline.timeline.instructions;
      }
      // Bookmarks 结构
      else if (json?.data?.bookmark_timeline_v2?.timeline?.instructions) {
        instructions = json.data.bookmark_timeline_v2.timeline.instructions;
      }
      // Likes 结构
      else if (json?.data?.user?.result?.timeline_v2?.timeline?.instructions) {
        instructions = json.data.user.result.timeline_v2.timeline.instructions;
      }
      
      if (!instructions) {
        console.log('[x-libris:injected] 未找到 instructions，原始结构:', Object.keys(json?.data || {}));
        return tweets;
      }
      
      for (const instruction of instructions) {
        if (instruction.type !== 'TimelineAddEntries') continue;
        
        for (const entry of instruction.entries || []) {
          const tweet = extractTweet(entry);
          if (tweet) tweets.push(tweet);
        }
      }
    } catch (e) {
      console.error('[x-libris:injected] 解析失败:', e);
    }
    
    return tweets;
  }
  
  function extractTweet(entry) {
    try {
      // entry.content.itemContent.tweet_results.result
      const result = entry?.content?.itemContent?.tweet_results?.result;
      if (!result) return null;
      
      // 处理 TweetWithVisibilityResults 包装
      const tweet = result.__typename === 'TweetWithVisibilityResults' 
        ? result.tweet 
        : result;
      
      if (!tweet || tweet.__typename !== 'Tweet') return null;
      
      const user = tweet.core?.user_results?.result;
      const legacy = tweet.legacy;
      const screenName = user?.core?.screen_name || user?.legacy?.screen_name;
      
      // 提取话题标签
      const hashtags = legacy?.entities?.hashtags?.map(h => h.text) || [];
      
      // 构建推文 URL
      const tweetUrl = screenName && tweet.rest_id 
        ? `https://x.com/${screenName}/status/${tweet.rest_id}`
        : null;
      
      return {
        id: tweet.rest_id,
        url: tweetUrl,
        author: {
          id: user?.rest_id,
          name: user?.core?.name,
          screen_name: screenName,
          avatar: user?.avatar?.image_url
        },
        text: legacy?.full_text,
        hashtags: hashtags,
        created_at: legacy?.created_at,
        metrics: {
          replies: legacy?.reply_count,
          retweets: legacy?.retweet_count,
          likes: legacy?.favorite_count,
          views: tweet.views?.count
        },
        media: legacy?.entities?.media?.map(m => ({
          type: m.type,
          url: m.media_url_https
        })) || []
      };
    } catch (e) {
      return null;
    }
  }

  /* ---------- XMLHttpRequest ---------- */
  const XHR = XMLHttpRequest.prototype;
  const originalOpen = XHR.open;
  const originalSend = XHR.send;

  XHR.open = function (method, url) {
    this.__x_libris_url = url;
    return originalOpen.apply(this, arguments);
  };

  XHR.send = function () {
    const xhr = this;
    const url = xhr.__x_libris_url;

    // 只对目标 URL 添加监听器
    if (isTarget(url)) {
      console.log('[x-libris:injected] XHR target detected:', url);

      xhr.addEventListener('load', function () {
        // 检查 responseType
        const responseType = xhr.responseType;
        if (responseType && responseType !== '' && responseType !== 'text') return;

        // 检查 content-type
        const contentType = xhr.getResponseHeader('content-type') || '';
        if (!contentType.includes('application/json')) return;

        // 安全读取 responseText
        let text;
        try {
          text = xhr.responseText;
        } catch (e) {
          return;
        }
        if (!text) return;

        const json = safeJsonParse(text);
        if (!json) return;

        const source = getSourceType(url);
        const tweets = parseTweets(json);
        
        // 精简日志，只打印数量
        console.log('[x-libris:injected] ✅ 抓取', tweets.length, '条推文，来源:', source);
        
        // 不再发送 raw 数据，减少内存占用
        window.postMessage(
          { type: 'X_LIBRIS_DATA', payload: { parsed: tweets, source } },
          '*'
        );
      });
    }

    return originalSend.apply(this, arguments);
  };

  /* ---------- fetch ---------- */
  const originalFetch = window.fetch;

  window.fetch = async (...args) => {
    const url = args[0]?.toString();
    const isTargetUrl = isTarget(url);
    
    if (isTargetUrl) {
      console.log('[x-libris:injected] fetch target detected:', url);
    }

    const res = await originalFetch(...args);

    if (isTargetUrl) {
      try {
        const clone = res.clone();
        const text = await clone.text();
        if (!text) return res;

        const json = safeJsonParse(text);
        if (!json) return res;

        const source = getSourceType(url);
        const tweets = parseTweets(json);
        
        console.log('[x-libris:injected] ✅ 抓取', tweets.length, '条推文，来源:', source);
        
        window.postMessage(
          { type: 'X_LIBRIS_DATA', payload: { parsed: tweets, source } },
          '*'
        );
      } catch (e) {
        console.error('[x-libris:injected] fetch hook error:', e.message);
      }
    }

    return res;
  };

  console.log('[x-libris:injected] XHR and fetch hooks installed');
})();
