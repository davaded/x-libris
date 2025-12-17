import React, { useState } from 'react';
import { Eye, Heart, Play } from 'lucide-react';
import { TableCell, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tweet } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from 'framer-motion';
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";

interface TweetRowProps {
    tweet: Tweet;
    isSelected: boolean;
    onToggle: (id: string) => void;
    onClick: (tweet: Tweet) => void;
    index: number;
}

const MotionTableRow = motion(TableRow);

export function TweetRow({ tweet, isSelected, onToggle, onClick, index }: TweetRowProps) {
    return (
        <MotionTableRow
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, delay: index * 0.05, ease: "easeOut" }}
            className={cn(
                "hover:bg-[#2a2a2a] transition-colors border-transparent group cursor-pointer rounded-md relative",
                isSelected && "bg-[#2a2a2a]"
            )}
            data-state={isSelected ? "selected" : undefined}
            onClick={() => onClick(tweet)}
        >
            {/* Checkbox */}
            <TableCell className="w-[50px] pl-6" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => onToggle(tweet.id)}
                    className="border-[#757575] data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 rounded-[2px]"
                />
            </TableCell>

            {/* User */}
            <TableCell className="w-[250px]">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 rounded-full ring-2 ring-transparent group-hover:ring-[#282828] transition-all">
                        <AvatarImage src={tweet.user.avatar} className="object-cover" />
                        <AvatarFallback className="bg-[#282828] text-[#b3b3b3]">
                            {tweet.user.name[0]}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0">
                        <span className="text-white text-base font-medium truncate group-hover:text-emerald-400 transition-colors">
                            {tweet.user.name}
                        </span>
                        <span className="text-[#b3b3b3] text-sm truncate group-hover:text-white transition-colors">@{tweet.user.handle}</span>
                    </div>
                </div>
            </TableCell>

            {/* Folder */}
            <TableCell className="w-[120px]">
                <Badge
                    variant="outline"
                    className={cn(
                        "font-medium border-transparent px-2.5 py-0.5 text-xs rounded-full bg-[#282828] text-white transition-all group-hover:bg-[#3e3e3e]",
                        tweet.folder === 'AI' && "text-emerald-400 bg-emerald-950/30 group-hover:bg-emerald-900/50",
                        tweet.folder === 'Dev' && "text-blue-400 bg-blue-950/30 group-hover:bg-blue-900/50"
                    )}
                >
                    {tweet.folder}
                </Badge>
            </TableCell>

            {/* Content */}
            <TableCell className="max-w-[400px]">
                <p className="text-[#b3b3b3] text-sm line-clamp-2 leading-relaxed group-hover:text-white transition-colors font-light tracking-wide">
                    {tweet.content}
                </p>
            </TableCell>

            {/* Media with Hover Preview */}
            <TableCell className="w-[100px]" onClick={(e) => e.stopPropagation()}>
                {tweet.media ? (
                    <HoverCard openDelay={200}>
                        <HoverCardTrigger asChild>
                            <div className="w-10 h-10 rounded bg-[#282828] overflow-hidden relative group/media shadow-sm cursor-zoom-in ring-1 ring-white/5 hover:ring-emerald-500/50 transition-all">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={tweet.media.url}
                                    alt="media"
                                    className="w-full h-full object-cover opacity-80 group-hover/media:opacity-100 transition-opacity"
                                />
                                {tweet.media.type === 'video' && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[1px]">
                                        <Play size={12} fill="white" className="text-white" />
                                    </div>
                                )}
                            </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-80 p-0 border-none bg-transparent shadow-2xl" side="right" align="start">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                className="rounded-xl overflow-hidden border border-[#3e3e3e] bg-[#181818] relative"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={tweet.media.url}
                                    alt="preview"
                                    className="w-full h-auto object-cover"
                                />
                                <div className="absolute bottom-0 left-0 w-full p-2 bg-gradient-to-t from-black/80 to-transparent text-xs text-white font-medium">
                                    Media Preview
                                </div>
                            </motion.div>
                        </HoverCardContent>
                    </HoverCard>
                ) : (
                    <div className="w-10 h-10 rounded bg-[#282828] flex items-center justify-center opacity-30">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#404040]" />
                    </div>
                )}
            </TableCell>

            {/* Stats */}
            <TableCell className="w-[150px]">
                <div className="flex items-center gap-4 text-[#b3b3b3]">
                    <div className="flex items-center gap-1.5 group/stat transition-all hover:scale-110" title="Likes">
                        <Heart size={16} className="group-hover/stat:text-emerald-500 transition-colors" />
                        <span className="text-sm font-medium group-hover/stat:text-white">{tweet.stats.likes}</span>
                    </div>
                </div>
            </TableCell>

            {/* Date */}
            <TableCell className="w-[120px] text-right pr-6 text-[#757575] text-sm font-normal group-hover:text-[#b3b3b3] transition-colors">
                {tweet.date.split(' ')[0]}
            </TableCell>
        </MotionTableRow>
    );
}
