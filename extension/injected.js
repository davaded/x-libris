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

  const isTarget = (url) =>
    url &&
    url.includes('graphql') &&
    /bookmark|usertweet/i.test(url);

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
      
      return {
        id: tweet.rest_id,
        author: {
          id: user?.rest_id,
          name: user?.core?.name,
          screen_name: user?.core?.screen_name,
          avatar: user?.avatar?.image_url
        },
        text: legacy?.full_text,
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
        console.log('[x-libris:injected] XHR load event fired');
        console.log('[x-libris:injected] XHR responseType:', xhr.responseType);
        console.log('[x-libris:injected] XHR status:', xhr.status);

        // 关键修复：检查 responseType
        const responseType = xhr.responseType;
        if (responseType && responseType !== '' && responseType !== 'text') {
          console.log('[x-libris:injected] Skipping non-text responseType:', responseType);
          return;
        }

        // 检查 content-type
        const contentType = xhr.getResponseHeader('content-type') || '';
        console.log('[x-libris:injected] XHR content-type:', contentType);
        
        if (!contentType.includes('application/json')) {
          console.log('[x-libris:injected] Skipping non-JSON content-type');
          return;
        }

        // 安全读取 responseText
        let text;
        try {
          text = xhr.responseText;
          console.log('[x-libris:injected] XHR responseText length:', text?.length);
        } catch (e) {
          console.error('[x-libris:injected] Failed to read responseText:', e.message);
          return;
        }

        if (!text) {
          console.log('[x-libris:injected] Empty responseText, skipping');
          return;
        }

        const json = safeJsonParse(text);
        if (!json) {
          console.log('[x-libris:injected] Failed to parse JSON, skipping');
          return;
        }

        console.log('[x-libris:injected] ✅ XHR 抓取成功！');
        
        // 解析 Twitter 数据结构
        const tweets = parseTweets(json);
        console.log('[x-libris:injected] 解析出 ' + tweets.length + ' 条推文');
        tweets.forEach((t, i) => {
          console.log(`[x-libris:injected] 推文 ${i + 1}:`, {
            id: t.id,
            author: t.author,
            text: t.text?.slice(0, 100) + '...',
            created_at: t.created_at,
            metrics: t.metrics
          });
        });
        
        window.postMessage(
          { type: 'X_LIBRIS_DATA', payload: { raw: json, parsed: tweets } },
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
        console.log('[x-libris:injected] fetch response status:', res.status);
        
        const clone = res.clone();
        const text = await clone.text();
        
        console.log('[x-libris:injected] fetch response text length:', text?.length);
        
        if (!text) {
          console.log('[x-libris:injected] Empty fetch response, skipping');
          return res;
        }

        const json = safeJsonParse(text);
        if (!json) {
          console.log('[x-libris:injected] Failed to parse fetch JSON, skipping');
          return res;
        }

        console.log('[x-libris:injected] ✅ fetch 抓取成功！');
        
        // 解析 Twitter 数据结构
        const tweets = parseTweets(json);
        console.log('[x-libris:injected] 解析出 ' + tweets.length + ' 条推文');
        tweets.forEach((t, i) => {
          console.log(`[x-libris:injected] 推文 ${i + 1}:`, {
            id: t.id,
            author: t.author,
            text: t.text?.slice(0, 100) + '...',
            created_at: t.created_at,
            metrics: t.metrics
          });
        });
        
        window.postMessage(
          { type: 'X_LIBRIS_DATA', payload: { raw: json, parsed: tweets } },
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
