'use client';

import React, { useState, useEffect } from 'react';
import { Tweet } from '@/lib/types';
import { TweetGrid } from '@/components/dashboard/TweetGrid';
import { 
  Search, Settings, Heart, Bookmark, LayoutGrid, 
  ChevronLeft, ChevronRight, RefreshCw, LogOut,
  Layers, Key
} from 'lucide-react';
import Link from 'next/link';

export default function App() {
  const [tweets, setTweets] = useState<Tweet[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeSource, setActiveSource] = useState('all');
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    likes: 0,
    bookmarks: 0,
    my_tweets: 0
  });

  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch data
  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (activeSource !== 'all') params.set('source', activeSource);

      const [tweetsRes, statsRes, userRes] = await Promise.all([
        fetch(`/api/tweets?${params}`),
        fetch('/api/stats'),
        fetch('/api/user')
      ]);

      const tweetsData = await tweetsRes.json();
      const statsData = await statsRes.json();
      const userData = await userRes.json();

      if (!tweetsData.error) {
        setTweets(tweetsData.tweets || []);
        setTotalPages(tweetsData.pagination?.totalPages || 1);
        setTotalItems(tweetsData.pagination?.total || 0);
      }

      if (!statsData.error) {
        const sourcesMap: Record<string, number> = {};
        statsData.sources?.forEach((s: any) => {
          sourcesMap[s.name] = s.count;
        });
        setStats({
          total: statsData.total || 0,
          likes: sourcesMap['likes'] || 0,
          bookmarks: sourcesMap['bookmarks'] || 0,
          my_tweets: sourcesMap['my_tweets'] || 0
        });
      }

      if (userData.user?.username) {
        setUsername(userData.user.username);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeSource, page, debouncedSearch]);

  const sources = [
    { id: 'all', label: 'All', icon: LayoutGrid, count: stats.total },
    { id: 'likes', label: 'Likes', icon: Heart, count: stats.likes },
    { id: 'bookmarks', label: 'Bookmarks', icon: Bookmark, count: stats.bookmarks },
    { id: 'my_tweets', label: 'My Tweets', icon: Layers, count: stats.my_tweets },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-64 bg-black border-r border-[#2c2c2e] flex flex-col z-50">
        {/* Logo */}
        <div className="p-6 flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <span className="font-bold text-black text-lg">X</span>
          </div>
          <span className="font-semibold text-lg">X-Libris</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4">
          <div className="space-y-1">
            {sources.map(source => (
              <button
                key={source.id}
                onClick={() => { setActiveSource(source.id); setPage(1); }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  activeSource === source.id
                    ? 'bg-[#2c2c2e] text-white'
                    : 'text-[#8e8e93] hover:bg-[#1c1c1e] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <source.icon size={20} />
                  <span className="font-medium">{source.label}</span>
                </div>
                <span className="text-sm tabular-nums">{source.count}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t border-[#2c2c2e] space-y-1">
          <Link href="/settings" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#8e8e93] hover:bg-[#1c1c1e] hover:text-white transition-all">
            <Key size={20} />
            <span className="font-medium">API Token</span>
          </Link>
          <Link href="/api/auth/signout" className="flex items-center gap-3 px-4 py-3 rounded-xl text-[#8e8e93] hover:bg-[#1c1c1e] hover:text-white transition-all">
            <LogOut size={20} />
            <span className="font-medium">Sign Out</span>
          </Link>
        </div>

        {/* User */}
        {username && (
          <div className="p-4 border-t border-[#2c2c2e]">
            <div className="flex items-center gap-3">
              <img
                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                alt={username}
                className="w-9 h-9 rounded-full bg-[#2c2c2e]"
              />
              <div>
                <p className="font-medium text-sm">{username}</p>
                <p className="text-xs text-[#8e8e93]">Logged in</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="ml-64">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-[#2c2c2e]">
          <div className="flex items-center justify-between px-6 py-4">
            {/* Search */}
            <div className="relative w-80">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8e93]" />
              <input
                type="text"
                placeholder="Search tweets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-[#1c1c1e] rounded-xl text-white placeholder-[#8e8e93] focus:outline-none focus:ring-2 focus:ring-[#0a84ff] transition-all"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#8e8e93]">
                {totalItems} tweets
              </span>
              <button
                onClick={loadData}
                disabled={loading}
                className="p-2.5 rounded-xl bg-[#1c1c1e] hover:bg-[#2c2c2e] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="min-h-[calc(100vh-73px)]">
          {loading && tweets.length === 0 ? (
            <div className="flex items-center justify-center h-[60vh]">
              <RefreshCw size={32} className="animate-spin text-[#8e8e93]" />
            </div>
          ) : (
            <TweetGrid tweets={tweets} />
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="sticky bottom-0 bg-black/80 backdrop-blur-xl border-t border-[#2c2c2e] px-6 py-4">
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg bg-[#1c1c1e] hover:bg-[#2c2c2e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm text-[#8e8e93] tabular-nums">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg bg-[#1c1c1e] hover:bg-[#2c2c2e] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
