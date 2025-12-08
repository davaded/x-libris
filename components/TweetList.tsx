/* eslint-disable @next/next/no-img-element */
import { MessageSquare, Heart, Repeat, Eye } from 'lucide-react'

export default function TweetList({ tweets }: { tweets: any[] }) {
    if (tweets.length === 0) {
        return <div className="text-center text-gray-500 mt-10">No tweets found.</div>
    }

    return (
        <div className="space-y-4 pb-10">
            {tweets.map(tweet => {
                const stats = tweet.stats as any || {};
                return (
                    <div key={tweet.id} className="bg-black border border-gray-800 rounded-xl p-4 hover:bg-gray-900/30 transition-colors">
                        <div className="flex space-x-3">
                            <img
                                src={tweet.authorAvatar}
                                alt={tweet.authorName}
                                className="w-10 h-10 rounded-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://abs.twimg.com/sticky/default_profile_images/default_profile_normal.png' }}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center space-x-2">
                                    <span className="font-bold text-white truncate">{tweet.authorName}</span>
                                    <span className="text-gray-500 text-sm truncate">@{tweet.authorHandle}</span>
                                    <span className="text-gray-500 text-sm">· {new Date(tweet.tweetedAt).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-200 mt-1 whitespace-pre-wrap break-words text-[15px] leading-normal">{tweet.content}</p>

                                {tweet.mediaUrls && tweet.mediaUrls.length > 0 && (
                                    <div className={`mt-3 grid gap-2 ${tweet.mediaUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                        {tweet.mediaUrls.map((url: string, i: number) => (
                                            <img key={i} src={url} alt="Media" className="rounded-lg border border-gray-800 w-full object-cover max-h-96" />
                                        ))}
                                    </div>
                                )}

                                <div className="flex items-center justify-between mt-3 text-gray-500 text-sm max-w-md">
                                    <div className="flex items-center space-x-1 group cursor-pointer hover:text-blue-500 transition-colors">
                                        <MessageSquare size={16} />
                                        <span>{stats.replies || 0}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 group cursor-pointer hover:text-green-500 transition-colors">
                                        <Repeat size={16} />
                                        <span>{stats.retweets || 0}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 group cursor-pointer hover:text-pink-500 transition-colors">
                                        <Heart size={16} />
                                        <span>{stats.likes || 0}</span>
                                    </div>
                                    <div className="flex items-center space-x-1 group cursor-pointer hover:text-blue-500 transition-colors">
                                        <Eye size={16} />
                                        <span>{stats.views || 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
