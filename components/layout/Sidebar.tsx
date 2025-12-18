import React from 'react';
import Link from 'next/link';
import {
    LayoutDashboard,
    Heart,
    Bookmark,
    Folder,
    Settings,
    Zap,
    Layers,
    Image as ImageIcon,
    Code2,
    PenTool,
    Key,
    LogOut
} from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';

interface SidebarProps {
    activeSource: string;
    setActiveSource: (source: string) => void;
    activeFolder: string;
    setActiveFolder: (folder: string) => void;
    stats: {
        total: number;
        unsorted: number;
        folders: { name: string, count: number }[];
    };
    username?: string;
    className?: string;
}

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    active?: boolean;
    count?: number;
    onClick?: () => void;
    variant?: 'default' | 'folder';
}

const SidebarItem = ({ icon: Icon, label, active, count, onClick, variant = 'default' }: SidebarItemProps) => (
    <Button
        variant="ghost"
        className={cn(
            "w-full justify-between px-4 py-2 h-auto font-medium transition-all duration-200 group rounded-[4px]",
            active
                ? "bg-[#282828] text-white"
                : "text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a]"
        )}
        onClick={onClick}
    >
        <div className="flex items-center gap-3">
            <Icon size={variant === 'folder' ? 18 : 20} className={cn(
                "transition-colors",
                active ? "text-emerald-500" : "text-[#b3b3b3] group-hover:text-white"
            )} />
            <span className={cn("truncate font-medium", variant === 'folder' && "text-sm")}>{label}</span>
        </div>
        {count !== undefined && (
            <span className={cn(
                "text-xs px-2 py-0.5 rounded-full transition-colors",
                active ? "text-emerald-500" : "text-[#b3b3b3] group-hover:text-white"
            )}>
                {count}
            </span>
        )}
    </Button>
);

export function Sidebar({
    activeSource,
    setActiveSource,
    activeFolder,
    setActiveFolder,
    stats,
    username,
    className
}: SidebarProps) {

    // Map icons to known folders
    const getFolderIcon = (name: string) => {
        switch (name.toLowerCase()) {
            case 'ai': return Zap;
            case 'dev': return Code2;
            case 'design': return PenTool;
            case 'media': return ImageIcon;
            default: return Folder;
        }
    };

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={cn("w-[280px] flex flex-col bg-black", className)}
        >
            {/* Brand */}
            <div className="p-6 flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <span className="font-bold text-sm text-black">X</span>
                </div>
                <span className="font-bold text-xl tracking-tight text-white">X-Libris</span>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 px-2">
                <div className="space-y-6 py-2">

                    {/* Main Section */}
                    <div className="space-y-1">
                        <SidebarItem
                            icon={LayoutDashboard}
                            label="All Tweets"
                            count={stats.total}
                            active={activeSource === "all" && activeFolder === "All"}
                            onClick={() => { setActiveSource("all"); setActiveFolder("All"); }}
                        />
                        <SidebarItem
                            icon={Heart}
                            label="Likes"
                            active={activeSource === "likes"}
                            onClick={() => { setActiveSource("likes"); setActiveFolder("All"); }}
                        />
                        <SidebarItem
                            icon={Bookmark}
                            label="Bookmarks"
                            active={activeSource === "bookmarks"}
                            onClick={() => { setActiveSource("bookmarks"); setActiveFolder("All"); }}
                        />
                    </div>

                    {/* Folders Section */}
                    <div>
                        <div className="px-4 mb-2 flex items-center justify-between">
                            <span className="text-xs font-bold text-[#b3b3b3] uppercase tracking-wider">Folders</span>
                            <Settings size={14} className="text-[#b3b3b3] cursor-pointer hover:text-white" />
                        </div>
                        <div className="space-y-1">
                            <SidebarItem
                                icon={Layers}
                                label="Unsorted"
                                count={stats.unsorted}
                                active={activeFolder === "Unsorted"}
                                onClick={() => setActiveFolder("Unsorted")}
                                variant="folder"
                            />

                            {stats.folders.filter(f => f.name !== 'Unsorted').map(folder => (
                                <SidebarItem
                                    key={folder.name}
                                    icon={getFolderIcon(folder.name)}
                                    label={folder.name}
                                    count={folder.count}
                                    active={activeFolder === folder.name}
                                    onClick={() => setActiveFolder(folder.name)}
                                    variant="folder"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </ScrollArea>

            {/* Settings & User */}
            <div className="p-4 bg-black space-y-2">
                {/* Settings Link */}
                <Link href="/settings">
                    <Button
                        variant="ghost"
                        className="w-full justify-start px-4 py-2 h-auto font-medium text-[#b3b3b3] hover:text-white hover:bg-[#1a1a1a] rounded-[4px]"
                    >
                        <Key size={18} className="mr-3" />
                        API Token 设置
                    </Button>
                </Link>
                
                {/* User Profile */}
                <div className="flex items-center gap-3 p-2 rounded-[4px] hover:bg-[#1a1a1a] cursor-pointer transition-colors group">
                    <Avatar className="h-9 w-9 border border-[#282828]">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username || 'User'}`} />
                        <AvatarFallback>{(username || 'U')[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col overflow-hidden flex-1">
                        <span className="text-white font-medium text-sm truncate group-hover:underline">{username || 'User'}</span>
                        <span className="text-[#b3b3b3] text-xs truncate">已登录</span>
                    </div>
                    <Link href="/api/auth/signout">
                        <LogOut size={16} className="text-[#b3b3b3] hover:text-white" />
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}
