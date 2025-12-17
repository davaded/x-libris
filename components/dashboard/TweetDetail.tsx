import React, { useTransition } from 'react';
import { Tweet } from '@/lib/types';
import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Calendar, Eye, Heart, MessageCircle, Repeat, Link as LinkIcon, Sparkles, RefreshCw, Trash2, X } from 'lucide-react';
import { reprocessTweet, deleteTweet } from '@/app/lib/actions';
import { motion } from 'framer-motion';

interface TweetDetailProps {
    tweet: Tweet | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function TweetDetail({ tweet, open, onOpenChange }: TweetDetailProps) {
    const [isPending, startTransition] = useTransition();

    if (!tweet) return null;

    const handleReprocess = () => {
        startTransition(async () => {
            await reprocessTweet(tweet.id);
        });
    };

    const handleDelete = () => {
        if (confirm('Delete this tweet?')) {
            startTransition(async () => {
                await deleteTweet(tweet.id);
                onOpenChange(false);
            });
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[600px] sm:max-w-[600px] bg-[#121212] border-l border-[#282828] text-white p-0 shadow-2xl">
                <ScrollArea className="h-full">
                    <div className="relative">
                        {/* Gradient Header */}
                        <div className="h-48 bg-gradient-to-b from-[#535353] to-[#121212] absolute top-0 left-0 w-full z-0 pointer-events-none opacity-40" />

                        <div className="p-8 relative z-10 space-y-8">

                            {/* User Info & Actions */}
                            <div className="flex items-end justify-between mt-8">
                                <div className="flex flex-col gap-4">
                                    <Avatar className="h-24 w-24 shadow-2xl">
                                        <AvatarImage src={tweet.user.avatar} className="object-cover" />
                                        <AvatarFallback>{tweet.user.name[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h1 className="text-white font-bold text-4xl tracking-tight mb-1">{tweet.user.name}</h1>
                                        <p className="text-[#b3b3b3] text-base">@{tweet.user.handle}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center gap-4 py-2">
                                <Button
                                    size="lg"
                                    className="bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-full h-12 px-8 hover:scale-105 transition-transform"
                                    onClick={handleReprocess}
                                    disabled={isPending}
                                >
                                    {isPending ? <RefreshCw size={20} className="animate-spin mr-2" /> : <Sparkles size={20} className="mr-2" />}
                                    Process AI
                                </Button>

                                <Button variant="outline" size="icon" className="h-12 w-12 rounded-full border-[#757575] text-[#b3b3b3] hover:border-white hover:text-white bg-transparent" onClick={handleDelete}>
                                    <Trash2 size={20} />
                                </Button>
                            </div>

                            {/* Tags */}
                            <div className="flex flex-wrap gap-2">
                                <Badge variant="secondary" className="bg-[#282828] text-white hover:bg-[#3e3e3e] rounded-full px-4 py-1">
                                    {tweet.folder}
                                </Badge>
                                {tweet.hashtags?.map(tag => (
                                    <Badge key={tag} variant="outline" className="border-[#757575] text-[#b3b3b3] hover:border-white hover:text-white rounded-full px-4 py-1 cursor-pointer">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>

                            {/* Main Content */}
                            <div className="space-y-6">
                                <p className="text-[#b3b3b3] text-lg leading-relaxed whitespace-pre-wrap font-normal">
                                    {tweet.content}
                                </p>

                                {/* Media */}
                                {tweet.media && (
                                    <div className="rounded-md overflow-hidden bg-[#282828] shadow-lg">
                                        {tweet.media.type === 'image' && (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img
                                                src={tweet.media.url}
                                                alt="Tweet media"
                                                className="w-full h-auto object-cover max-h-[500px]"
                                            />
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Stats Grid */}
                            <div className="grid grid-cols-4 gap-4 p-4 rounded-md bg-[#181818]">
                                <StatItem icon={Eye} value={tweet.stats.views} label="Views" />
                                <StatItem icon={Heart} value={tweet.stats.likes} label="Likes" />
                                <StatItem icon={Repeat} value={tweet.stats.retweets} label="Retweets" />
                                <StatItem icon={MessageCircle} value={tweet.stats.replies} label="Replies" />
                            </div>

                            {/* Footer Metadata */}
                            <div className="flex items-center justify-between text-xs text-[#757575] pt-8 border-t border-[#282828]">
                                <div className="flex items-center gap-4">
                                    <span>{tweet.date}</span>
                                    <span className="w-1 h-1 bg-[#757575] rounded-full" />
                                    <a href={tweet.url || '#'} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                                        Open Original
                                    </a>
                                </div>
                            </div>

                        </div>
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
}

function StatItem({ icon: Icon, value, label }: { icon: any, value: number | string, label: string }) {
    return (
        <div className="flex flex-col items-center gap-1 text-[#b3b3b3]">
            <Icon size={20} className="mb-1" />
            <span className="text-lg font-bold text-white">{value}</span>
            <span className="text-[10px] uppercase tracking-wider">{label}</span>
        </div>
    );
}
