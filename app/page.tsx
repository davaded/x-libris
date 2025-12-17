'use client';

import React, { useState, useEffect } from 'react';
import { Tweet } from '@/lib/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { TweetTable } from '@/components/dashboard/TweetTable';
import { CustomPagination } from '@/components/ui/custom-pagination';
import { TweetDetail } from '@/components/dashboard/TweetDetail';
import { fetchFilteredTweets, fetchTweetStats } from '@/app/lib/data';
import { deleteTweet } from '@/app/lib/actions';
import { Loader2 } from 'lucide-react';

export default function App() {
    const [tweets, setTweets] = useState<Tweet[]>([]);
    const [selectedIds, setSelectedIds] = useState(new Set<string>());
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [activeFolder, setActiveFolder] = useState("All");
    const [activeSource, setActiveSource] = useState("all");
    const [loading, setLoading] = useState(true);

    // Stats State
    const [stats, setStats] = useState({
        total: 0,
        unsorted: 0,
        folders: [] as { name: string, count: number }[]
    });

    // Detail Drawer State
    const [selectedTweet, setSelectedTweet] = useState<Tweet | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch Data
    const loadData = async () => {
        setLoading(true);
        try {
            const [tweetsData, statsData] = await Promise.all([
                fetchFilteredTweets(debouncedSearch, page, activeFolder === 'All' ? undefined : activeFolder),
                fetchTweetStats()
            ]);

            setTweets(tweetsData.tweets as any);
            setTotalPages(tweetsData.totalPages);
            setTotalItems(tweetsData.totalCount);
            setStats(statsData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeSource, activeFolder, page, debouncedSearch]);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === tweets.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(tweets.map(t => t.id)));
    };

    const handleDelete = async () => {
        if (confirm(`Are you sure you want to delete ${selectedIds.size} tweets?`)) {
            const idsToDelete = Array.from(selectedIds);
            for (const id of idsToDelete) {
                await deleteTweet(id);
            }
            setSelectedIds(new Set());
            loadData(); // Refresh data
        }
    };

    const handleRowClick = (tweet: Tweet) => {
        setSelectedTweet(tweet);
        setDetailOpen(true);
    };

    return (
        <div className="flex h-screen w-full bg-[#121212] text-zinc-100 font-sans overflow-hidden selection:bg-emerald-500/30">
            {/* Ambient Background - Subtle Green */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[150px]" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-green-900/5 rounded-full blur-[150px]" />
            </div>

            <Sidebar
                activeSource={activeSource}
                setActiveSource={setActiveSource}
                activeFolder={activeFolder}
                setActiveFolder={setActiveFolder}
                stats={stats}
                className="relative z-20"
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden relative z-10">
                <Header
                    activeSource={activeSource}
                    activeFolder={activeFolder}
                    total={totalItems}
                    loading={loading}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedCount={selectedIds.size}
                    onDelete={handleDelete}
                />

                <main className="flex-1 overflow-hidden p-4">
                    <div className="h-full flex flex-col bg-[#181818] rounded-lg shadow-xl overflow-hidden border border-[#282828]">
                        {loading && tweets.length === 0 ? (
                            <div className="flex-1 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                            </div>
                        ) : (
                            <TweetTable
                                tweets={tweets}
                                selectedIds={selectedIds}
                                onToggle={toggleSelection}
                                onToggleAll={toggleSelectAll}
                                activeFolder={activeFolder}
                                onRowClick={handleRowClick}
                            />
                        )}

                        <div className="p-4 border-t border-[#282828] bg-[#181818]">
                            <CustomPagination
                                currentPage={page}
                                totalPages={totalPages}
                                totalItems={totalItems}
                                selectedCount={selectedIds.size}
                                onPageChange={setPage}
                            />
                        </div>
                    </div>
                </main>
            </div>

            <TweetDetail
                tweet={selectedTweet}
                open={detailOpen}
                onOpenChange={setDetailOpen}
            />
        </div>
    );
}
