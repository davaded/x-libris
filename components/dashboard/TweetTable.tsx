import React from 'react';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from 'lucide-react';
import { Tweet } from "@/lib/types";
import { TweetRow } from "./TweetRow";
import { AnimatePresence } from "framer-motion";

interface TweetTableProps {
    tweets: Tweet[];
    selectedIds: Set<string>;
    onToggle: (id: string) => void;
    onToggleAll: () => void;
    activeFolder: string;
    onRowClick: (tweet: Tweet) => void;
}

export function TweetTable({ tweets, selectedIds, onToggle, onToggleAll, activeFolder, onRowClick }: TweetTableProps) {
    const allSelected = tweets.length > 0 && selectedIds.size === tweets.length;

    return (
        <div className="flex-1 overflow-auto custom-scrollbar bg-[#121212]">
            <Table>
                <TableHeader className="bg-[#121212] sticky top-0 z-10 border-b border-[#282828]">
                    <TableRow className="hover:bg-transparent border-[#282828]">
                        <TableHead className="w-[50px] pl-6">
                            <Checkbox
                                checked={allSelected}
                                onCheckedChange={onToggleAll}
                                className="border-[#757575] data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500 rounded-[2px]"
                            />
                        </TableHead>
                        <TableHead className="w-[250px] text-[#b3b3b3] font-medium text-xs uppercase tracking-wider">Author</TableHead>
                        <TableHead className="w-[120px] text-[#b3b3b3] font-medium text-xs uppercase tracking-wider">Folder</TableHead>
                        <TableHead className="min-w-[400px] text-[#b3b3b3] font-medium text-xs uppercase tracking-wider">Content</TableHead>
                        <TableHead className="w-[100px] text-[#b3b3b3] font-medium text-xs uppercase tracking-wider">Media</TableHead>
                        <TableHead className="w-[150px] text-[#b3b3b3] font-medium text-xs uppercase tracking-wider">Stats</TableHead>
                        <TableHead className="w-[120px] text-right pr-6 text-[#b3b3b3] font-medium text-xs uppercase tracking-wider">Date</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    <AnimatePresence mode='wait'>
                        {tweets.map((tweet, index) => (
                            <TweetRow
                                key={tweet.id}
                                tweet={tweet}
                                index={index}
                                isSelected={selectedIds.has(tweet.id)}
                                onToggle={onToggle}
                                onClick={onRowClick}
                            />
                        ))}
                    </AnimatePresence>
                </TableBody>
            </Table>

            {tweets.length === 0 && (
                <div className="flex flex-col items-center justify-center h-[60vh] text-[#b3b3b3]">
                    <div className="w-16 h-16 bg-[#282828] rounded-full flex items-center justify-center mb-4">
                        <Search size={24} className="opacity-50" />
                    </div>
                    <p className="text-lg font-bold text-white">No tweets found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filters</p>
                </div>
            )}
        </div>
    );
}
