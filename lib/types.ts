export interface Tweet {
    id: string;
    user: {
        name: string;
        handle: string;
        avatar: string;
    };
    folder: string;
    source: string; // "my_tweets" | "likes" | "bookmarks"
    content: string;
    media: {
        type: string;
        count: number;
        url: string;
    } | null;
    stats: {
        views: string | number;
        retweets: number;
        likes: number | string;
        replies: number;
    };
    date: string;
    lastUpdated: string;
    hashtags?: string[];
    url?: string;
}
