import Link from 'next/link'
import { Folder, Hash, LayoutGrid } from 'lucide-react'

export default function Sidebar({ folders, activeFolder }: { folders: any[], activeFolder: string }) {
    return (
        <div className="w-64 bg-black border-r border-gray-800 h-screen p-4 flex flex-col fixed overflow-y-auto">
            <h1 className="text-xl font-bold text-white mb-6 px-3">X Manager</h1>
            <nav className="space-y-1">
                {folders.map(folder => (
                    <Link
                        key={folder.name}
                        href={`/?folder=${folder.name}`}
                        className={`flex items-center justify-between px-3 py-2 rounded-full text-sm font-medium transition-colors ${(activeFolder === folder.name || (folder.name === 'All' && !activeFolder))
                                ? 'bg-gray-800 text-white'
                                : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                            }`}
                    >
                        <span className="flex items-center truncate">
                            {folder.name === 'All' ? <LayoutGrid size={18} className="mr-3 flex-shrink-0" /> :
                                folder.name === 'Unsorted' ? <Hash size={18} className="mr-3 flex-shrink-0" /> :
                                    <Folder size={18} className="mr-3 flex-shrink-0" />}
                            <span className="truncate">{folder.name}</span>
                        </span>
                        <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full text-gray-500 ml-2">
                            {folder.count}
                        </span>
                    </Link>
                ))}
            </nav>
        </div>
    )
}
