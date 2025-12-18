'use client';

import React from 'react';
import { Tweet } from '@/lib/types';
import { TweetCard } from './TweetCard';
import { Inbox } from 'lucide-react';

interface TweetGridProps {
  tweets: Tweet[];
}

export function TweetGrid({ tweets }: TweetGridProps) {
  if (tweets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-[#8e8e93]">
        <div className="w-20 h-20 bg-[#2c2c2e] rounded-full flex items-center justify-center mb-4">
          <Inbox size={32} className="text-[#8e8e93]" />
        </div>
        <p className="text-xl font-semibold text-white mb-1">No tweets yet</p>
        <p className="text-sm">Use the browser extension to collect tweets</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 p-6">
      {tweets.map((tweet, index) => (
        <TweetCard key={tweet.id} tweet={tweet} index={index} />
      ))}
    </div>
  );
}
