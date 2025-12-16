'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { Tweet } from '@/lib/types';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { TweetTable } from '@/components/dashboard/TweetTable';
import { RefreshCw } from 'lucide-react';
import { CustomPagination } from '@/components/ui/custom-pagination';
import { TweetDetail } from '@/components/dashboard/TweetDetail';

export default function App() {
    const [tweets, setTweets] = useState<Tweet[]>([]);
    const [selectedIds, setSelectedIds] = useState(new Set<string>());
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [activeFolder, setActiveFolder] = useState("All");
    const [activeSource, setActiveSource] = useState("all");
    const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);

    // Detail Drawer State
    const [selectedTweet, setSelectedTweet] = useState<Tweet | null>(null);
    const [detailOpen, setDetailOpen] = useState(false);

    // Pagination state
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Search debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // --- Fetch Data ---
    useEffect(() => {
        async function fetchTweets() {
            setLoading(true);
            try {
                const params = new URLSearchParams();
                params.set('page', page.toString());
                params.set('pageSize', pageSize.toString());
                if (activeSource !== 'all') params.set('source', activeSource);
                if (activeFolder !== 'All') params.set('folder', activeFolder);
                if (debouncedSearch) params.set('search', debouncedSearch);

                const res = await fetch(`/api/tweets?${params}`);
                const data = await res.json();

                if (data.tweets && Array.isArray(data.tweets)) {
                    setTweets(data.tweets);
                    setSourceCounts(data.sourceCounts || {});
                    setTotalPages(data.pagination?.totalPages || 1);
                    setTotal(data.pagination?.total || 0);
                } else {
                    setTweets([]);
                }
            } catch (error) {
                console.error('Error fetching tweets:', error);
                setTweets([]);
            } finally {
                setLoading(false);
            }
        }
        fetchTweets();
    }, [activeSource, activeFolder, page, pageSize, debouncedSearch]);

    // --- Logic: Auto-Calculate Counts from Data ---
    const folderCounts = useMemo(() => {
        const counts: Record<string, number> = { "All": tweets.length, "Unsorted": 0, "AI": 0, "Dev": 0, "Design": 0, "Media": 0, "Knowledge": 0 };
        tweets.forEach(t => {
            if (counts[t.folder] !== undefined) {
                counts[t.folder]++;
            } else {
                if (!counts[t.folder]) counts[t.folder] = 0;
                counts[t.folder]++;
            }
        });
        return counts;
    }, [tweets]);

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

    const handleDelete = () => {
        // Mock delete functionality
        console.log("Deleting", selectedIds);
        setSelectedIds(new Set());
    };

    const handleRowClick = (tweet: Tweet) => {
        setSelectedTweet(tweet);
        setDetailOpen(true);
    };

    if (loading && tweets.length === 0) {
        // Initial loading state
        return (
            <div className="flex h-screen w-full bg-[#09090b] items-center justify-center text-zinc-500">
                <RefreshCw className="animate-spin mr-2" /> Loading tweets...
            </div>
        )
    }

    return (
        <div className="flex h-screen w-full bg-[#09090b] text-zinc-300 font-sans overflow-hidden">
            <Sidebar
                activeSource={activeSource}
                setActiveSource={setActiveSource}
                activeFolder={activeFolder}
                setActiveFolder={setActiveFolder}
                sourceCounts={sourceCounts}
                folderCounts={folderCounts}
            />

            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#09090b]">
                <Header
                    activeSource={activeSource}
                    activeFolder={activeFolder}
                    total={total}
                    loading={loading}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedCount={selectedIds.size}
                    onDelete={handleDelete}
                />

                <TweetTable
                    tweets={tweets}
                    selectedIds={selectedIds}
                    onToggle={toggleSelection}
                    onToggleAll={toggleSelectAll}
                    activeFolder={activeFolder}
                    onRowClick={handleRowClick}
                />

                <CustomPagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={total}
                    selectedCount={selectedIds.size}
                    onPageChange={setPage}
                />
            </div>

            <TweetDetail
                tweet={selectedTweet}
                open={detailOpen}
                onOpenChange={setDetailOpen}
            />
        </div>
    );
}
