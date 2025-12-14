import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (apiKey !== process.env.API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    let count = 0;

    // 新格式：{ parsed, source, skipExisting } 来自扩展
    if (body.parsed && Array.isArray(body.parsed)) {
      const source = body.source || 'unknown';
      const skipExisting = body.skipExisting !== false; // 默认跳过已存在
      let skipped = 0;
      
      console.log('[import] 来源:', source, '共', body.parsed.length, '条，skipExisting:', skipExisting);

      // 如果跳过已存在，先批量查询哪些已存在
      let existingIds = new Set<string>();
      if (skipExisting) {
        const ids = body.parsed.map((t: any) => t.id).filter(Boolean);
        const existing = await prisma.tweet.findMany({
          where: { id: { in: ids } },
          select: { id: true }
        });
        existingIds = new Set(existing.map((t: { id: string }) => t.id));
        console.log('[import] 已存在', existingIds.size, '条，将跳过');
      }
      
      for (const tweet of body.parsed) {
        if (!tweet.id) continue;

        // 如果开启跳过已存在，且该推文已存在，则跳过
        if (skipExisting && existingIds.has(tweet.id)) {
          skipped++;
          continue;
        }

        const content = tweet.text || '';
        const folder = autoTag(content, tweet.hashtags || []);

        if (skipExisting) {
          // 只创建新的，不更新
          await prisma.tweet.create({
            data: {
              id: tweet.id,
              url: tweet.url || null,
              content,
              authorName: tweet.author?.name || '',
              authorHandle: tweet.author?.screen_name || '',
              authorAvatar: tweet.author?.avatar || '',
              mediaUrls: tweet.media?.map((m: { url: string }) => m.url) || [],
              hashtags: tweet.hashtags || [],
              folder,
              source,
              stats: {
                views: parseInt(tweet.metrics?.views) || 0,
                likes: tweet.metrics?.likes || 0,
                retweets: tweet.metrics?.retweets || 0,
                replies: tweet.metrics?.replies || 0,
              },
              tweetedAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
            },
          });
        } else {
          // upsert 模式：更新已存在的
          await prisma.tweet.upsert({
            where: { id: tweet.id },
            update: {
              source,
              hashtags: tweet.hashtags || [],
              stats: {
                views: parseInt(tweet.metrics?.views) || 0,
                likes: tweet.metrics?.likes || 0,
                retweets: tweet.metrics?.retweets || 0,
                replies: tweet.metrics?.replies || 0,
              },
            },
            create: {
              id: tweet.id,
              url: tweet.url || null,
              content,
              authorName: tweet.author?.name || '',
              authorHandle: tweet.author?.screen_name || '',
              authorAvatar: tweet.author?.avatar || '',
              mediaUrls: tweet.media?.map((m: { url: string }) => m.url) || [],
              hashtags: tweet.hashtags || [],
              folder,
              source,
              stats: {
                views: parseInt(tweet.metrics?.views) || 0,
                likes: tweet.metrics?.likes || 0,
                retweets: tweet.metrics?.retweets || 0,
                replies: tweet.metrics?.replies || 0,
              },
              tweetedAt: tweet.created_at ? new Date(tweet.created_at) : new Date(),
            },
          });
        }
        count++;
      }

      console.log('[import] 完成，新增:', count, '跳过:', skipped);
      return NextResponse.json({ ok: true, count, skipped });
    }
    // 旧格式：{ instructions } 直接从 Twitter API
    else if (body.instructions && Array.isArray(body.instructions)) {
      console.log('[import] 使用 instructions 格式');
      count = await importFromInstructions(body.instructions);
    }
    // 兼容：直接传入 raw Twitter 数据
    else if (body.raw?.data) {
      console.log('[import] 使用 raw 格式');
      const instructions = extractInstructions(body.raw);
      if (instructions) {
        count = await importFromInstructions(instructions);
      }
    }

    console.log('[import] 导入完成，共', count, '条');
    return NextResponse.json({ ok: true, count });
  } catch (error) {
    console.error('[import] 错误:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// 从 Twitter raw 数据中提取 instructions
function extractInstructions(raw: any): any[] | null {
  // UserTweets
  if (raw?.data?.user?.result?.timeline?.timeline?.instructions) {
    return raw.data.user.result.timeline.timeline.instructions;
  }
  // Bookmarks
  if (raw?.data?.bookmark_timeline_v2?.timeline?.instructions) {
    return raw.data.bookmark_timeline_v2.timeline.instructions;
  }
  // Likes
  if (raw?.data?.user?.result?.timeline_v2?.timeline?.instructions) {
    return raw.data.user.result.timeline_v2.timeline.instructions;
  }
  return null;
}

// 从 instructions 格式导入
async function importFromInstructions(instructions: any[]): Promise<number> {
  let count = 0;

  for (const instruction of instructions) {
    if (instruction.type !== 'TimelineAddEntries') continue;

    for (const entry of instruction.entries || []) {
      const itemContent = entry.content?.itemContent;
      if (!itemContent) continue;

      const tweetResult = itemContent.tweet_results?.result;
      if (!tweetResult) continue;

      // 处理 TweetWithVisibilityResults 包装
      const result = tweetResult.__typename === 'TweetWithVisibilityResults'
        ? tweetResult.tweet
        : (tweetResult.tweet || tweetResult);

      const legacy = result?.legacy;
      const core = result?.core;
      if (!legacy || !core) continue;

      const id = result.rest_id;
      if (!id) continue;

      // 新版 Twitter API 结构
      const userResult = core.user_results?.result;
      const userLegacy = userResult?.legacy || {};
      const userCore = userResult?.core || {};

      const content = legacy.full_text || '';
      const authorName = userCore.name || userLegacy.name || '';
      const authorHandle = userCore.screen_name || userLegacy.screen_name || '';
      const authorAvatar = userResult?.avatar?.image_url || userLegacy.profile_image_url_https || '';

      const media = legacy.entities?.media || [];
      const mediaUrls = media.map((m: any) => m.media_url_https);

      const stats = {
        views: result.views?.count ? parseInt(result.views.count) : 0,
        likes: legacy.favorite_count || 0,
        retweets: legacy.retweet_count || 0,
        replies: legacy.reply_count || 0,
      };

      const folder = autoTag(content);

      await prisma.tweet.upsert({
        where: { id },
        update: { stats },
        create: {
          id,
          content,
          authorName,
          authorHandle,
          authorAvatar,
          mediaUrls,
          folder,
          stats,
          tweetedAt: new Date(legacy.created_at),
        },
      });
      count++;
    }
  }

  return count;
}

// 自动标签
function autoTag(content: string, hashtags: string[] = []): string {
  const lower = content.toLowerCase();
  const tags = hashtags.map(t => t.toLowerCase());
  
  // 检查内容和标签
  const hasAI = lower.includes('ai') || lower.includes('gpt') || lower.includes('llm') || lower.includes('claude') ||
    tags.some(t => ['ai', 'gpt', 'llm', 'chatgpt', 'openai', 'claude', 'gemini'].includes(t));
  
  const hasDev = lower.includes('github') || lower.includes('code') || lower.includes('programming') ||
    tags.some(t => ['dev', 'code', 'programming', 'javascript', 'python', 'rust', 'golang', 'typescript'].includes(t));
  
  const hasDesign = lower.includes('design') || lower.includes('figma') ||
    tags.some(t => ['design', 'ui', 'ux', 'figma', 'sketch'].includes(t));
  
  if (hasAI) return 'AI';
  if (hasDev) return 'Dev';
  if (hasDesign) return 'Design';
  
  return 'Unsorted';
}
