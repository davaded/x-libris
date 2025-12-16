import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, MoreHorizontal } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CustomPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    selectedCount: number;
    onPageChange: (page: number) => void;
}

export function CustomPagination({
    currentPage,
    totalPages,
    totalItems,
    selectedCount,
    onPageChange
}: CustomPaginationProps) {

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5; // Number of pages to show around current page

        if (totalPages <= maxVisiblePages + 2) {
            // If total pages is small, show all
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // Calculate start and end of visible range
            let start = Math.max(2, currentPage - 1);
            let end = Math.min(totalPages - 1, currentPage + 1);

            // Adjust if near start or end
            if (currentPage <= 3) {
                end = Math.min(totalPages - 1, 4);
            }
            if (currentPage >= totalPages - 2) {
                start = Math.max(2, totalPages - 3);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // Always show last page
            pages.push(totalPages);
        }
        return pages;
    };

    return (
        <div className="h-16 border-t border-zinc-800 flex items-center justify-between px-6 bg-[#09090b]">
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
            <div className="flex items-center gap-1.5">
                {/* First Page */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30"
                >
                    <ChevronsLeft size={14} />
                </Button>

                {/* Previous Page */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="h-8 w-8 p-0 bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30 mr-1"
                >
                    <ChevronLeft size={14} />
                </Button>

                {/* Page Numbers */}
                {getPageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                        {page === '...' ? (
                            <div className="h-8 w-8 flex items-center justify-center text-zinc-600">
                                <MoreHorizontal size={14} />
                            </div>
                        ) : (
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={() => onPageChange(page as number)}
                                className={cn(
                                    "h-8 w-8 p-0 border-zinc-800 transition-all",
                                    currentPage === page
                                        ? "bg-zinc-700 text-white border-zinc-600 font-medium hover:bg-zinc-600"
                                        : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                                )}
                            >
                                {page}
                            </Button>
                        )}
                    </React.Fragment>
                ))}

                {/* Next Page */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30 ml-1"
                >
                    <ChevronRight size={14} />
                </Button>

                {/* Last Page */}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="h-8 w-8 p-0 bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white disabled:opacity-30"
                >
                    <ChevronsRight size={14} />
                </Button>
            </div>
        </div>
    );
}
