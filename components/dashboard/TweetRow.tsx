import React from 'react';
import { Eye, Heart, CheckSquare, Square, Play } from 'lucide-react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tweet } from "@/lib/types";
import { cn } from "@/lib/utils";

interface TweetRowProps {
    tweet: Tweet;
    isSelected: boolean;
    onToggle: (id: string) => void;
    onClick: (tweet: Tweet) => void;
}

export function TweetRow({ tweet, isSelected, onToggle, onClick }: TweetRowProps) {
    return (
        <TableRow
            className={cn(
                "hover:bg-zinc-800/50 transition-colors border-zinc-800 group cursor-pointer",
                isSelected && "bg-zinc-800/30"
            )}
            data-state={isSelected ? "selected" : undefined}
            onClick={() => onClick(tweet)}
        >
            {/* Checkbox */}
            <TableCell className="w-[40px] pl-4" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(tweet.id)}
                    className="border-zinc-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
            </TableCell>

            {/* ID/Status */}
            <TableCell className="w-[80px] text-center">
                <div className="flex flex-col items-center gap-1">
                    <span className="text-zinc-500 text-xs font-mono">#{tweet.id.slice(-4)}</span>
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/80 shadow-[0_0_8px_rgba(16,185,129,0.4)]" title="Synced"></div>
                </div>
            </TableCell>

            {/* User */}
            <TableCell className="w-[200px]">
                <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-zinc-700">
                        <AvatarImage src={tweet.user.avatar} className="object-cover" />
                        <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <span className="text-zinc-200 text-sm font-medium truncate">{tweet.user.name}</span>
                        <span className="text-zinc-500 text-xs truncate">{tweet.user.handle}</span>
                    </div>
                </div>
            </TableCell>

            {/* Folder (Auto-Classified) */}
            <TableCell className="w-[120px]">
                <Badge
                    variant="outline"
                    className={cn(
                        "font-normal border-opacity-30 bg-opacity-10",
                        tweet.folder === 'AI' || tweet.folder === 'AI Tools' ? 'bg-purple-500 text-purple-400 border-purple-500' :
                            tweet.folder === 'Dev' ? 'bg-blue-500 text-blue-400 border-blue-500' :
                                tweet.folder === 'Media' ? 'bg-pink-500 text-pink-400 border-pink-500' :
                                    tweet.folder === 'Design' ? 'bg-orange-500 text-orange-400 border-orange-500' :
                                        'bg-zinc-500 text-zinc-400 border-zinc-500'
                    )}
                >
                    {tweet.folder}
                </Badge>
            </TableCell>

            {/* Content */}
            <TableCell className="max-w-[400px]">
                <p className="text-zinc-300 text-sm line-clamp-2 leading-relaxed">
                    {tweet.content}
                </p>
            </TableCell>

            {/* Media */}
            <TableCell className="w-[80px]">
                {tweet.media ? (
                    <div className="w-10 h-10 rounded-md bg-zinc-800 border border-zinc-700 overflow-hidden relative group/media cursor-pointer hover:ring-2 hover:ring-zinc-600 transition-all">
                        <img src={tweet.media.url} alt="media" className="w-full h-full object-cover opacity-80 group-hover/media:opacity-100 transition-opacity" />
                        {tweet.media.type === 'video' && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                                <Play size={12} fill="white" className="text-white" />
                            </div>
                        )}
                        {tweet.media.count > 1 && (
                            <div className="absolute bottom-0 right-0 bg-black/80 text-[8px] text-white px-1 py-0.5 rounded-tl-sm">
                                +{tweet.media.count - 1}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="w-10 h-10 rounded-md bg-zinc-900/50 border border-zinc-800/50"></div>
                )}
            </TableCell>

            {/* Stats */}
            <TableCell className="w-[180px]">
                <div className="flex items-center justify-between text-xs text-zinc-500">
                    <div className="flex flex-col items-center w-10 gap-0.5">
                        <span className="text-zinc-400">{tweet.stats.views}</span>
                        <Eye size={12} />
                    </div>
                    <div className="flex flex-col items-center w-10 gap-0.5">
                        <span className="text-zinc-400">{tweet.stats.likes}</span>
                        <Heart size={12} />
                    </div>
                    <div className="flex flex-col items-end text-[10px] text-zinc-600 ml-2">
                        <span>更新于</span>
                        <span>{tweet.lastUpdated}</span>
                    </div>
                </div>
            </TableCell>

            {/* Date */}
            <TableCell className="w-[100px] text-right pr-4 text-zinc-500 text-xs">
                {tweet.date.split(' ')[0]}
            </TableCell>
        </TableRow>
    );
}
