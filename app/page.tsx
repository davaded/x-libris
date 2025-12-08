'use client';
import React, { useState, useMemo, useEffect } from 'react';
import {
    Search,
    LayoutGrid,
    List,
    Filter,
    Download,
    Trash2,
    FolderInput,
    MoreHorizontal,
    Zap,
    Folder,
    ChevronLeft,
    ChevronRight,
    CheckSquare,
    Square,
    Image as ImageIcon,
    RefreshCw,
    Code2,
    BrainCircuit,
    Palette,
    Video,
    FileText,
    User,
    Eye,
    Heart
} from 'lucide-react';

interface Tweet {
    id: string;
    user: {
        name: string;
        handle: string;
        avatar: string;
    };
    folder: string;
    content: string;
    media: {
        type: string;
        count: number;
        url: string;
    } | null;
    stats: {
        views: string | number;
        retweets: number;
        likes: number | string;
        replies: number;
    };
    date: string;
    lastUpdated: string;
}

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    active?: boolean;
    count?: number;
    hasSubmenu?: boolean;
    onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, count, hasSubmenu, onClick }: SidebarItemProps) => (
    <div
        onClick={onClick}
        className={`flex items-center justify-between px-3 py-2 cursor-pointer rounded-md transition-colors ${active ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
    >
        <div className="flex items-center gap-3">
            <Icon size={18} />
            <span className="text-sm font-medium">{label}</span>
        </div>
        {count !== undefined && <span className="text-xs text-gray-500">{count}</span>}
        {hasSubmenu && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
    </div>
);

interface IconButtonProps {
    icon: React.ElementType;
    active?: boolean;
    onClick?: () => void;
}

const IconButton = ({ icon: Icon, active, onClick }: IconButtonProps) => (
    <button
        onClick={onClick}
        className={`p-2 rounded-md transition-colors ${active ? 'bg-white/10 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}`}
    >
        <Icon size={18} />
    </button>
);

interface TweetRowProps {
    tweet: Tweet;
    isSelected: boolean;
    onToggle: (id: string) => void;
}

const TweetRow = ({ tweet, isSelected, onToggle }: TweetRowProps) => {
    return (
        <tr className={`border-b border-gray-800 hover:bg-white/5 transition-colors group ${isSelected ? 'bg-blue-500/10' : ''}`}>
            {/* Checkbox */}
            <td className="p-4 w-10">
                <button onClick={() => onToggle(tweet.id)} className="text-gray-500 hover:text-white">
                    {isSelected ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                </button>
            </td>

            {/* ID/Status */}
            <td className="py-4 px-2 w-16 text-center">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-gray-500 text-xs">#{tweet.id.slice(-4)}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500/50" title="Synced"></div>
                </div>
            </td>

            {/* User */}
            <td className="py-4 px-2 w-48">
                <div className="flex items-center gap-3">
                    <img src={tweet.user.avatar} alt="avatar" className="w-10 h-10 rounded-full bg-gray-700 object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png' }} />
                    <div className="flex flex-col min-w-0">
                        <span className="text-white text-sm font-medium truncate">{tweet.user.name}</span>
                        <span className="text-gray-500 text-xs truncate">{tweet.user.handle}</span>
                    </div>
                </div>
            </td>

            {/* Folder (Auto-Classified) */}
            <td className="py-4 px-2 w-32">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${tweet.folder === 'AI' || tweet.folder === 'AI Tools' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                    tweet.folder === 'Dev' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        tweet.folder === 'Media' ? 'bg-pink-500/10 text-pink-400 border-pink-500/20' :
                            tweet.folder === 'Design' ? 'bg-orange-500/10 text-orange-400 border-orange-500/20' :
                                'bg-[#1e2327] text-gray-400 border-gray-700'
                    }`}>
                    {tweet.folder}
                </span>
            </td>

            {/* Content */}
            <td className="py-4 px-2 max-w-md">
                <p className="text-gray-300 text-sm line-clamp-2 leading-relaxed">
                    {tweet.content}
                </p>
            </td>

            {/* Media */}
            <td className="py-4 px-2 w-20">
                {tweet.media ? (
                    <div className="w-10 h-10 rounded bg-gray-800 border border-gray-700 overflow-hidden relative group/media cursor-pointer">
                        <img src={tweet.media.url} alt="media" className="w-full h-full object-cover opacity-80 group-hover/media:opacity-100 transition-opacity" />
                        {tweet.media.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <div className="w-0 h-0 border-t-4 border-t-transparent border-l-6 border-l-white border-b-4 border-b-transparent ml-0.5"></div>
                            </div>
                        )}
                        {tweet.media.count > 1 && (
                            <div className="absolute bottom-0 right-0 bg-black/60 text-[8px] text-white px-1">
                                +{tweet.media.count - 1}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-10 h-10"></div>
                )}
            </td>

            {/* Stats */}
            <td className="py-4 px-2 w-48">
                <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex flex-col items-center w-10">
                        <span className="mb-1 text-gray-400">{tweet.stats.views}</span>
                        <Eye size={12} />
                    </div>
                    <div className="flex flex-col items-center w-10">
                        <span className="mb-1 text-gray-400">{tweet.stats.likes}</span>
                        <Heart size={12} />
                    </div>
                    {/* Added Last Synced Info */}
                    <div className="flex flex-col items-end text-[10px] text-gray-600 ml-2">
                        <span>更新於</span>
                        <span>{tweet.lastUpdated}</span>
                    </div>
                </div>
            </td>

            {/* Date */}
            <td className="py-4 px-2 text-gray-500 text-xs w-24 text-right pr-4">
                {tweet.date.split(' ')[0]}
            </td>
        </tr>
    );
};

export default function App() {
    const [tweets, setTweets] = useState<Tweet[]>([]);
    const [selectedIds, setSelectedIds] = useState(new Set<string>());
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFolder, setActiveFolder] = useState("All");
    const [loading, setLoading] = useState(true);

    // --- Fetch Data ---
    useEffect(() => {
        async function fetchTweets() {
            try {
                const res = await fetch('/api/tweets');
                const data = await res.json();
                if (Array.isArray(data)) {
                    setTweets(data);
                } else {
                    console.error('Fetched data is not an array:', data);
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
    }, []);

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

    // --- Logic: Filtering ---
    const filteredTweets = useMemo(() => {
        let result = tweets;

        // 1. Folder Filter
        if (activeFolder !== "All") {
            result = result.filter(t => t.folder === activeFolder);
        }

        // 2. Search Filter
        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.content.toLowerCase().includes(lowerQuery) ||
                t.user.name.toLowerCase().includes(lowerQuery) ||
                t.user.handle.toLowerCase().includes(lowerQuery)
            );
        }
        return result;
    }, [tweets, searchQuery, activeFolder]);

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === filteredTweets.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(filteredTweets.map(t => t.id)));
    };

    const allSelected = filteredTweets.length > 0 && selectedIds.size === filteredTweets.length;

    if (loading) {
        return (
            <div className="flex h-screen w-full bg-[#0a0a0a] items-center justify-center text-gray-500">
                <RefreshCw className="animate-spin mr-2" /> Loading tweets...
            </div>
        )
    }

    return (
        <div className="flex h-screen w-full bg-[#0a0a0a] text-gray-300 font-sans overflow-hidden">

            {/* --- Sidebar --- */}
            <div className="w-64 flex flex-col border-r border-gray-800 bg-[#0f0f0f]">
                {/* User Profile */}
                <div className="p-4 border-b border-gray-800 flex items-center gap-3">
                    <img
                        src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin"
                        alt="My Profile"
                        className="w-10 h-10 rounded-full bg-indigo-600"
                    />
                    <div className="flex flex-col">
                        <span className="text-white font-semibold text-sm">Admin</span>
                        <span className="text-gray-500 text-xs">@admin</span>
                    </div>
                    <MoreHorizontal size={16} className="ml-auto text-gray-500 cursor-pointer" />
                </div>

                {/* Navigation */}
                <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
                    <div className="px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">我的資料</div>
                    <SidebarItem icon={FileText} label="所有推文" count={folderCounts["All"]} active={activeFolder === "All"} onClick={() => setActiveFolder("All")} />
                    <SidebarItem icon={User} label="使用者" />
                    <SidebarItem icon={List} label="列表" />
                    <SidebarItem icon={Zap} label="發現" />

                    <div className="mt-6 px-3 mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">智能分類 (AI)</div>
                    <SidebarItem icon={BrainCircuit} label="AI" count={folderCounts["AI"] || 0} active={activeFolder === "AI"} onClick={() => setActiveFolder("AI")} />
                    <SidebarItem icon={Code2} label="Dev" count={folderCounts["Dev"] || 0} active={activeFolder === "Dev"} onClick={() => setActiveFolder("Dev")} />
                    <SidebarItem icon={Palette} label="Design" count={folderCounts["Design"] || 0} active={activeFolder === "Design"} onClick={() => setActiveFolder("Design")} />
                    <SidebarItem icon={Video} label="Media" count={folderCounts["Media"] || 0} active={activeFolder === "Media"} onClick={() => setActiveFolder("Media")} />

                    <div className="mt-6 px-3 flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">資料夾</span>
                        <button className="text-gray-500 hover:text-white"><FolderInput size={14} /></button>
                    </div>
                    <SidebarItem icon={Folder} label="Unsorted" count={folderCounts["Unsorted"] || 0} active={activeFolder === "Unsorted"} onClick={() => setActiveFolder("Unsorted")} />
                </div>

                {/* Sync Status (New Feature Simulation) */}
                <div className="p-3 mx-2 mb-2 rounded bg-green-900/10 border border-green-900/30 flex items-center gap-2">
                    <div className="relative">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-[10px] text-green-400 font-medium">Extension Connected</span>
                        <span className="text-[9px] text-green-600/70">Last synced: Just now</span>
                    </div>
                    <RefreshCw size={12} className="ml-auto text-green-700 cursor-pointer hover:rotate-180 transition-transform" />
                </div>

                {/* Upgrade Banner */}
                <div className="p-4 border-t border-gray-800">
                    <button className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-white text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-colors">
                        <Zap size={14} className="text-yellow-400" />
                        升級到 Pro
                    </button>
                </div>
            </div>

            {/* --- Main Content --- */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a0a0a]">

                {/* Top Bar */}
                <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-[#0a0a0a]">
                    <div className="flex items-center gap-4 flex-1">
                        <h2 className="text-white font-semibold text-lg">{activeFolder === 'All' ? '所有推文' : activeFolder}</h2>
                        <span className="px-2 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full">{filteredTweets.length} items</span>
                    </div>

                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
                        <input
                            type="text"
                            placeholder="搜尋標題、內容或作者..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-[#161616] border border-gray-700 rounded-full py-1.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-gray-500 transition-colors"
                        />
                    </div>
                </div>

                {/* Toolbar */}
                <div className="h-12 border-b border-gray-800 flex items-center justify-between px-6 bg-[#0a0a0a]">
                    <div className="flex items-center gap-2">
                        <div className="flex bg-[#161616] rounded-md p-1 border border-gray-700">
                            <IconButton icon={List} active />
                            <IconButton icon={LayoutGrid} />
                            <IconButton icon={ImageIcon} />
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button className="p-2 text-gray-400 hover:text-white transition-colors"><Filter size={18} /></button>
                        <button className="p-2 text-gray-400 hover:text-white transition-colors"><Download size={18} /></button>
                        <div className="w-px h-4 bg-gray-700 mx-1"></div>
                        {selectedIds.size > 0 && (
                            <button className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1">
                                <Trash2 size={14} />
                                <span>刪除 ({selectedIds.size})</span>
                            </button>
                        )}
                    </div>
                </div>

                {/* Content Table */}
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#0a0a0a] sticky top-0 z-10 text-xs text-gray-500 font-medium uppercase tracking-wider">
                            <tr>
                                <th className="p-4 w-10 border-b border-gray-800 bg-[#0a0a0a]">
                                    <button onClick={toggleSelectAll} className="hover:text-white transition-colors">
                                        {allSelected ? <CheckSquare size={18} className="text-blue-500" /> : <Square size={18} />}
                                    </button>
                                </th>
                                <th className="py-3 px-2 w-16 text-center border-b border-gray-800 bg-[#0a0a0a]">ID</th>
                                <th className="py-3 px-2 w-48 border-b border-gray-800 bg-[#0a0a0a]">使用者</th>
                                <th className="py-3 px-2 w-32 border-b border-gray-800 bg-[#0a0a0a]">分類 (Auto)</th>
                                <th className="py-3 px-2 border-b border-gray-800 bg-[#0a0a0a]">推文內容</th>
                                <th className="py-3 px-2 w-20 border-b border-gray-800 bg-[#0a0a0a]">媒體</th>
                                <th className="py-3 px-2 w-48 border-b border-gray-800 bg-[#0a0a0a]">互動數據 / 更新</th>
                                <th className="py-3 px-2 w-24 text-right pr-4 border-b border-gray-800 bg-[#0a0a0a]">日期</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {filteredTweets.map((tweet) => (
                                <TweetRow
                                    key={tweet.id}
                                    tweet={tweet}
                                    isSelected={selectedIds.has(tweet.id)}
                                    onToggle={toggleSelection}
                                />
                            ))}
                        </tbody>
                    </table>

                    {filteredTweets.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                            <Search size={48} className="mb-4 opacity-20" />
                            <p>沒有找到符合 "{activeFolder}" 的推文</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="h-14 border-t border-gray-800 flex items-center justify-between px-6 bg-[#0a0a0a]">
                    <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded hover:bg-white/10 text-gray-400 disabled:opacity-50"><ChevronLeft size={16} /></button>
                        <div className="flex items-center gap-1">
                            <button className="w-7 h-7 flex items-center justify-center rounded bg-white/10 text-white text-xs font-medium">1</button>
                            <span className="text-gray-600 text-xs">/ 1 頁</span>
                        </div>
                        <button className="p-1.5 rounded hover:bg-white/10 text-gray-400"><ChevronRight size={16} /></button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>已選擇 {selectedIds.size} / {tweets.length}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
