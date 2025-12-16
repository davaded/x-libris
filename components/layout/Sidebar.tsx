import React from 'react';
import {
    FileText,
    User,
    Heart,
    Folder,
    BrainCircuit,
    Code2,
    Palette,
    Video,
    FolderInput,
    MoreHorizontal,
    Zap,
    RefreshCw
} from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface SidebarProps {
    activeSource: string;
    setActiveSource: (source: string) => void;
    activeFolder: string;
    setActiveFolder: (folder: string) => void;
    sourceCounts: Record<string, number>;
    folderCounts: Record<string, number>;
    className?: string;
}

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    active?: boolean;
    count?: number;
    onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active, count, onClick }: SidebarItemProps) => (
    <Button
        variant="ghost"
        className={cn(
            "w-full justify-between px-3 py-2 h-auto font-normal hover:bg-zinc-800/50",
            active ? "bg-zinc-800 text-white font-medium" : "text-zinc-400"
        )}
        onClick={onClick}
    >
        <div className="flex items-center gap-3">
            <Icon size={18} />
            <span>{label}</span>
        </div>
        {count !== undefined && <span className="text-xs text-zinc-500">{count}</span>}
    </Button>
);

export function Sidebar({
    activeSource,
    setActiveSource,
    activeFolder,
    setActiveFolder,
    sourceCounts,
    folderCounts,
    className
}: SidebarProps) {
    const totalCount = Object.values(sourceCounts).reduce((a, b) => a + b, 0);

    return (
        <div className={cn("w-64 flex flex-col border-r border-zinc-800 bg-[#09090b]", className)}>
            {/* User Profile */}
            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                <Avatar className="h-9 w-9 border border-zinc-700">
                    <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=Admin" />
                    <AvatarFallback>AD</AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-white font-medium text-sm">Admin</span>
                    <span className="text-zinc-500 text-xs">@admin</span>
                </div>
                <Button variant="ghost" size="icon" className="ml-auto h-8 w-8 text-zinc-500">
                    <MoreHorizontal size={16} />
                </Button>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4 px-2">
                <div className="space-y-1">
                    <div className="px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">来源分类</div>
                    <SidebarItem
                        icon={FileText}
                        label="全部"
                        count={totalCount}
                        active={activeSource === "all"}
                        onClick={() => { setActiveSource("all"); setActiveFolder("All"); }}
                    />
                    <SidebarItem
                        icon={User}
                        label="我的推文"
                        count={sourceCounts["my_tweets"] || 0}
                        active={activeSource === "my_tweets"}
                        onClick={() => { setActiveSource("my_tweets"); setActiveFolder("All"); }}
                    />
                    <SidebarItem
                        icon={Heart}
                        label="喜欢"
                        count={sourceCounts["likes"] || 0}
                        active={activeSource === "likes"}
                        onClick={() => { setActiveSource("likes"); setActiveFolder("All"); }}
                    />
                    <SidebarItem
                        icon={Folder}
                        label="收藏"
                        count={sourceCounts["bookmarks"] || 0}
                        active={activeSource === "bookmarks"}
                        onClick={() => { setActiveSource("bookmarks"); setActiveFolder("All"); }}
                    />

                    <div className="mt-6 px-3 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">智能分类 (AI)</div>
                    <SidebarItem icon={BrainCircuit} label="AI" count={folderCounts["AI"] || 0} active={activeFolder === "AI"} onClick={() => setActiveFolder("AI")} />
                    <SidebarItem icon={Code2} label="Dev" count={folderCounts["Dev"] || 0} active={activeFolder === "Dev"} onClick={() => setActiveFolder("Dev")} />
                    <SidebarItem icon={Palette} label="Design" count={folderCounts["Design"] || 0} active={activeFolder === "Design"} onClick={() => setActiveFolder("Design")} />
                    <SidebarItem icon={Video} label="Media" count={folderCounts["Media"] || 0} active={activeFolder === "Media"} onClick={() => setActiveFolder("Media")} />

                    <div className="mt-6 px-3 flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">文件夹</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-white">
                            <FolderInput size={14} />
                        </Button>
                    </div>
                    <SidebarItem icon={Folder} label="Unsorted" count={folderCounts["Unsorted"] || 0} active={activeFolder === "Unsorted"} onClick={() => setActiveFolder("Unsorted")} />
                </div>
            </ScrollArea>

            {/* Sync Status */}
            <div className="p-3 mx-2 mb-2 rounded bg-emerald-950/30 border border-emerald-900/50 flex items-center gap-2">
                <div className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] text-emerald-400 font-medium">Extension Connected</span>
                    <span className="text-[9px] text-emerald-600/70">Last synced: Just now</span>
                </div>
                <RefreshCw size={12} className="ml-auto text-emerald-700 cursor-pointer hover:rotate-180 transition-transform" />
            </div>


        </div>
    );
}
