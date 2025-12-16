import React from 'react';
import { Tweet } from '@/lib/types';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Calendar, Eye, Heart, MessageCircle, Repeat, Link as LinkIcon } from 'lucide-react';

interface TweetDetailProps {
    tweet: Tweet | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TweetDetail({ tweet, open, onOpenChange }: TweetDetailProps) {
    if (!tweet) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[540px] sm:max-w-[540px] bg-[#09090b] border-l border-zinc-800 text-zinc-300 p-0">
                <ScrollArea className="h-full">
                    <div className="p-6 space-y-6">
                        {/* Header: User Info */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-12 w-12 border border-zinc-700">
                                    <AvatarImage src={tweet.user.avatar} />
                                    <AvatarFallback>{tweet.user.name[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <h3 className="text-white font-semibold text-lg">{tweet.user.name}</h3>
                                    <p className="text-zinc-500 text-sm">{tweet.user.handle}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-400">
                                    {tweet.folder}
                                </Badge>
                                <Badge variant="outline" className="bg-zinc-900 border-zinc-700 text-zinc-400">
                                    {tweet.source}
                                </Badge>
                            </div>
                        </div>

                        <Separator className="bg-zinc-800" />

                        {/* Content */}
                        <div className="space-y-4">
                            <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
                                {tweet.content}
                            </p>

                            {/* Media */}
                            {tweet.media && (
                                <div className="rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900/50">
                                    {tweet.media.type === 'image' && (
                                        <img
                                            src={tweet.media.url}
                                            alt="Tweet media"
                                            className="w-full h-auto object-cover max-h-[400px]"
                                        />
                                    )}
                                    <div className="p-2 text-xs text-zinc-500 flex items-center justify-center bg-zinc-900">
                                        {tweet.media.count > 1 ? `+${tweet.media.count - 1} more items` : 'Media attachment'}
                                    </div>
                                </div>
                            )}

                            {/* Hashtags */}
                            {tweet.hashtags && tweet.hashtags.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {tweet.hashtags.map((tag, i) => (
                                        <span key={i} className="text-blue-400 text-sm hover:underline cursor-pointer">
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Stats & Meta */}
                        <div className="grid grid-cols-4 gap-4 py-4 border-y border-zinc-800">
                            <div className="flex flex-col items-center gap-1 text-zinc-500">
                                <Eye size={16} />
                                <span className="text-xs">{tweet.stats.views}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-zinc-500">
                                <Heart size={16} />
                                <span className="text-xs">{tweet.stats.likes}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-zinc-500">
                                <Repeat size={16} />
                                <span className="text-xs">{tweet.stats.retweets}</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 text-zinc-500">
                                <MessageCircle size={16} />
                                <span className="text-xs">{tweet.stats.replies}</span>
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="space-y-3 text-sm text-zinc-500">
                            <div className="flex items-center gap-2">
                                <Calendar size={14} />
                                <span>Published: {tweet.date}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <LinkIcon size={14} />
                                <a href={tweet.url || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-blue-400 truncate max-w-[400px]">
                                    {tweet.url || 'No URL available'}
                                </a>
                            </div>
                        </div>

                        {/* Raw JSON */}
                        <div className="space-y-2">
                            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Raw Data</h4>
                            <div className="bg-zinc-950 rounded-md p-4 border border-zinc-800 overflow-auto max-h-[300px]">
                                <pre className="text-xs text-zinc-400 font-mono whitespace-pre-wrap">
                                    {JSON.stringify(tweet, null, 2)}
                                </pre>
                            </div>
                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}
