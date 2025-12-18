import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
    pages: {
        signIn: '/login',
    },
    callbacks: {
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user;
            const isOnDashboard = !nextUrl.pathname.startsWith('/login');

            // Allow access to extension APIs (handled by token check in route)
            if (nextUrl.pathname.startsWith('/api/import') || 
                nextUrl.pathname.startsWith('/api/tweets/ids') ||
                nextUrl.pathname.startsWith('/api/tokens/verify')) {
                return true;
            }

            if (isOnDashboard) {
                if (isLoggedIn) return true;
                return false; // Redirect unauthenticated users to login page
            } else if (isLoggedIn) {
                return Response.redirect(new URL('/', nextUrl));
            }
            return true;
        },
    },
    providers: [], // Add providers with an empty array for now
} satisfies NextAuthConfig;
