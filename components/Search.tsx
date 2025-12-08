'use client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTransition } from 'react'

export default function Search() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [isPending, startTransition] = useTransition()

    function handleSearch(term: string) {
        const params = new URLSearchParams(searchParams.toString())
        if (term) {
            params.set('q', term)
        } else {
            params.delete('q')
        }
        startTransition(() => {
            router.replace(`/?${params.toString()}`)
        })
    }

    return (
        <div className="relative w-full max-w-xs">
            <input
                type="text"
                placeholder="Search tweets..."
                className="w-full bg-gray-900 border border-gray-700 rounded-full py-2 px-4 text-gray-100 focus:outline-none focus:border-blue-500 placeholder-gray-500 text-sm"
                defaultValue={searchParams.get('q')?.toString()}
                onChange={(e) => handleSearch(e.target.value)}
            />
        </div>
    )
}
