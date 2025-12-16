import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MinimalPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    selectedCount: number;
    onPageChange: (page: number) => void;
}

export function MinimalPagination({
    currentPage,
    totalPages,
    totalItems,
    selectedCount,
    onPageChange
}: MinimalPaginationProps) {
    return (
        <div className="h-14 border-t border-zinc-800 flex items-center justify-between px-6 bg-[#09090b]">
            {/* Left: Stats */}
            <div className="text-xs text-zinc-500 font-medium flex items-center gap-2">
                <span>Total {totalItems} items</span>
                {selectedCount > 0 && (
                    <>
                        <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                        <span className="text-zinc-400">{selectedCount} selected</span>
                    </>
                )}
            </div>

            {/* Right: Controls */}
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                >
                    <ChevronLeft size={16} />
                </Button>

                <span className="text-xs font-medium text-zinc-300 px-3 min-w-[80px] text-center">
                    Page {currentPage} of {totalPages}
                </span>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                    className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30"
                >
                    <ChevronRight size={16} />
                </Button>
            </div>
        </div>
    );
}
