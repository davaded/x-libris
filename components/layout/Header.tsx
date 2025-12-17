import React from 'react';
import { Search, Filter, Download, Trash2, RefreshCw, Plus } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from 'framer-motion';

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

    return (
        <div className="h-16 flex items-center justify-between px-8 bg-[#121212] sticky top-0 z-30">
            {/* Search - Center/Leftish */}
            <div className="flex items-center gap-4 flex-1">
                <div className="relative w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b3b3b3] group-focus-within:text-white transition-colors" size={20} />
                    <Input
                        type="text"
                        placeholder="What do you want to find?"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-[#242424] border-transparent focus-visible:ring-2 focus-visible:ring-white focus-visible:border-transparent text-white rounded-full h-12 transition-all hover:bg-[#2a2a2a] hover:border-[#404040] placeholder:text-[#757575]"
                    />
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-4">
                {/* Toolbar Buttons */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-[#b3b3b3] hover:text-white hover:scale-105 transition-transform rounded-full font-bold">
                        Filter
                    </Button>
                    <Button variant="ghost" size="sm" className="text-[#b3b3b3] hover:text-white hover:scale-105 transition-transform rounded-full font-bold">
                        Export
                    </Button>
                </div>

                {/* Primary Action / Delete */}
                {selectedCount > 0 ? (
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                        <Button
                            onClick={onDelete}
                            className="bg-red-500 hover:bg-red-400 text-white font-bold rounded-full h-10 px-6"
                        >
                            Delete ({selectedCount})
                        </Button>
                    </motion.div>
                ) : (
                    <Button className="bg-white hover:bg-[#f2f2f2] text-black font-bold rounded-full h-10 px-6 hover:scale-105 transition-transform">
                        Add New
                    </Button>
                )}
            </div>
        </div>
    );
}
