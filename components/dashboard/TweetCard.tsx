'use client';

import React from 'react';
import { Tweet } from '@/lib/types';
import { Heart, MessageCircle, Repeat, ExternalLink, Bookmark, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface TweetCardProps {
  tweet: Tweet;
  index: number;
}

export function TweetCard({ tweet, index }: TweetCardProps) {
  const handleClick = () => {
    if (tweet.url) {
      window.open(tweet.url, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      onClick={handleClick}
      className="group bg-[#1c1c1e] hover:bg-[#2c2c2e] rounded-2xl p-5 cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-xl border border-transparent hover:border-[#3a3a3c]"
    >
      {/* Header: Author */}
      <div className="flex items-center gap-3 mb-3">
        <img
          src={tweet.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${tweet.user.handle}`}
          alt={tweet.user.name}
          className="w-10 h-10 rounded-full bg-[#3a3a3c]"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-[15px] truncate">{tweet.user.name}</span>
            <span className="text-[#8e8e93] text-sm">@{tweet.user.handle}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-[#8e8e93]">
            <span>{tweet.date}</span>
            {tweet.source && (
              <>
                <span>·</span>
                <span className="capitalize">{tweet.source.replace('_', ' ')}</span>
              </>
            )}
          </div>
        </div>
        <ExternalLink size={16} className="text-[#8e8e93] opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Content */}
      <p className="text-[#f5f5f7] text-[15px] leading-relaxed mb-3 line-clamp-4 whitespace-pre-wrap">
        {tweet.content}
      </p>

      {/* Media Preview */}
      {tweet.media && (
        <div className="mb-3 rounded-xl overflow-hidden bg-[#2c2c2e]">
          <img
            src={tweet.media.url}
            alt="Media"
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      {/* Hashtags */}
      {tweet.hashtags && tweet.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tweet.hashtags.slice(0, 5).map(tag => (
            <span key={tag} className="text-[#0a84ff] text-sm">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer: Stats */}
      <div className="flex items-center gap-6 text-[#8e8e93] text-sm pt-2 border-t border-[#3a3a3c]/50">
        <div className="flex items-center gap-1.5">
          <Heart size={14} />
          <span>{formatNumber(tweet.stats.likes)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Repeat size={14} />
          <span>{formatNumber(tweet.stats.retweets)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MessageCircle size={14} />
          <span>{formatNumber(tweet.stats.replies)}</span>
        </div>
        {tweet.media && (
          <div className="flex items-center gap-1.5 ml-auto">
            <ImageIcon size={14} />
            <span>{tweet.media.count}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatNumber(num: number | string): string {
  const n = typeof num === 'string' ? parseInt(num) : num;
  if (isNaN(n)) return '0';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}
