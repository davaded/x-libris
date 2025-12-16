import React from 'react';
import { Search, List, LayoutGrid, Image as ImageIcon, Filter, Download, Trash2, RefreshCw } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator"; // Note: Need to check if Separator is installed, if not I'll use div. It wasn't in my list. I'll use div or install it. I'll use div for now to be safe.
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
    activeSource: string;
    activeFolder: string;
    total: number;
    loading: boolean;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedCount: number;
    onDelete: () => void;
}

export function Header({
    activeSource,
    activeFolder,
    total,
    loading,
    searchQuery,
    setSearchQuery,
    selectedCount,
    onDelete
}: HeaderProps) {
    const getTitle = () => {
        switch (activeSource) {
            case 'likes': return '喜欢';
            case 'bookmarks': return '收藏';
            case 'my_tweets': return '我的推文';
            default: return '推文';
        }
    };

    return (
        <div className="flex flex-col bg-[#09090b] border-b border-zinc-800">
            {/* Top Bar */}
            <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-800">
                <div className="flex items-center gap-4 flex-1">
                    <h2 className="text-white font-semibold text-lg flex items-center gap-2">
                        {getTitle()}
                        {activeFolder !== 'All' && <span className="text-zinc-500 font-normal">/ {activeFolder}</span>}
                    </h2>
                    <Badge variant="secondary" className="bg-zinc-800 text-zinc-400 hover:bg-zinc-700">
                        {total} 条
                    </Badge>
                    {loading && <RefreshCw size={14} className="animate-spin text-zinc-500" />}
                </div>

                <div className="relative w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
                    <Input
                        type="text"
                        placeholder="搜索标题、内容或作者..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-zinc-900/50 border-zinc-800 focus-visible:ring-zinc-700 text-zinc-300"
                    />
                </div>
            </div>

            {/* Toolbar */}
            <div className="h-12 flex items-center justify-between px-6">
                <div className="flex items-center gap-2">
                    <div className="flex bg-zinc-900 rounded-md p-1 border border-zinc-800">
                        <Button variant="ghost" size="icon" className="h-7 w-7 bg-zinc-800 text-white">
                            <List size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-zinc-300">
                            <LayoutGrid size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-500 hover:text-zinc-300">
                            <ImageIcon size={16} />
                        </Button>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white gap-2">
                        <Filter size={16} />
                        <span className="text-xs">筛选</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white gap-2">
                        <Download size={16} />
                        <span className="text-xs">导出</span>
                    </Button>

                    <div className="w-px h-4 bg-zinc-800 mx-2"></div>

                    {selectedCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            className="text-red-400 hover:text-red-300 hover:bg-red-950/30 gap-2"
                        >
                            <Trash2 size={16} />
                            <span className="text-xs">删除 ({selectedCount})</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}
