import React from 'react';
import {
    Table,
    TableBody,
    TableHead,
    TableHeader,
    TableRow,
    TableCell
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Search } from 'lucide-react';
import { Tweet } from "@/lib/types";
import { TweetRow } from "./TweetRow";
import { ScrollArea } from "@/components/ui/scroll-area";

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
        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 overflow-auto custom-scrollbar">
                <Table>
                    <TableHeader className="bg-[#09090b] sticky top-0 z-10">
                        <TableRow className="hover:bg-transparent border-zinc-800">
                            <TableHead className="w-[40px] pl-4">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={onToggleAll}
                                    className="border-zinc-600 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                            </TableHead>
                            <TableHead className="w-[80px] text-center">ID</TableHead>
                            <TableHead className="w-[200px]">用户</TableHead>
                            <TableHead className="w-[120px]">分类 (Auto)</TableHead>
                            <TableHead className="max-w-[400px]">推文内容</TableHead>
                            <TableHead className="w-[80px]">媒体</TableHead>
                            <TableHead className="w-[180px]">互动数据 / 更新</TableHead>
                            <TableHead className="w-[100px] text-right pr-4">日期</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {tweets.map((tweet) => (
                            <TweetRow
                                key={tweet.id}
                                tweet={tweet}
                                isSelected={selectedIds.has(tweet.id)}
                                onToggle={onToggle}
                                onClick={onRowClick}
                            />
                        ))}
                    </TableBody>
                </Table>

                {tweets.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
                        <Search size={48} className="mb-4 opacity-20" />
                        <p>没有找到符合 "{activeFolder}" 的推文</p>
                    </div>
                )}
            </div>
        </div>
    );
}
