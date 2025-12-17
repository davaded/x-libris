'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { authenticate } from '@/app/lib/actions';
import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
    const [errorMessage, dispatch] = useFormState(authenticate, undefined);

    return (
        <div className="flex min-h-screen w-full bg-black text-white font-sans selection:bg-emerald-500/30">
            {/* Left Side - Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-12 lg:px-24 xl:px-32 relative z-10 bg-[#121212]">

                {/* Logo */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute top-8 left-8 sm:left-12 lg:left-24 xl:left-32 flex items-center gap-2"
                >
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                        <span className="font-bold text-sm text-black">X</span>
                    </div>
                    <span className="font-bold text-xl tracking-tight">X-Libris</span>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="w-full max-w-md mx-auto"
                >
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold tracking-tighter mb-3 text-white">
                            Log in to X-Libris
                        </h1>
                    </div>

                    <form action={dispatch} className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-white" htmlFor="username">
                                Username
                            </label>
                            <input
                                className="w-full bg-[#121212] border border-[#727272] rounded-[4px] px-4 py-3 text-base placeholder:text-[#727272] focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all hover:border-white text-white"
                                id="username"
                                type="text"
                                name="username"
                                placeholder="Username"
                                required
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-bold text-white" htmlFor="password">
                                Password
                            </label>
                            <input
                                className="w-full bg-[#121212] border border-[#727272] rounded-[4px] px-4 py-3 text-base placeholder:text-[#727272] focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent transition-all hover:border-white text-white"
                                id="password"
                                type="password"
                                name="password"
                                placeholder="Password"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input type="checkbox" className="peer sr-only" />
                                    <div className="w-4 h-4 border border-[#727272] rounded-[2px] bg-[#121212] peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all group-hover:border-white"></div>
                                    <Check className="w-3 h-3 text-black absolute top-0.5 left-0.5 opacity-0 peer-checked:opacity-100 transition-opacity" />
                                </div>
                                <span className="text-sm text-[#b3b3b3] group-hover:text-white transition-colors">Remember me</span>
                            </label>
                        </div>

                        <LoginButton />

                        <div className="flex justify-center mt-4">
                            <Link href="#" className="text-sm font-bold text-white hover:underline transition-colors">
                                Forgot your password?
                            </Link>
                        </div>

                        <div
                            className="flex h-6 items-end justify-center"
                            aria-live="polite"
                            aria-atomic="true"
                        >
                            {errorMessage && (
                                <motion.p
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-xs text-red-500 font-bold"
                                >
                                    {errorMessage}
                                </motion.p>
                            )}
                        </div>
                    </form>

                    <div className="mt-8 pt-8 border-t border-[#282828] text-center text-sm text-[#b3b3b3]">
                        Don&apos;t have an account?{' '}
                        <Link href="#" className="font-bold text-white hover:underline transition-colors">
                            Sign up for X-Libris
                        </Link>
                    </div>
                </motion.div>
            </div>

            {/* Right Side - Image */}
            <div className="hidden lg:block w-1/2 relative bg-gradient-to-b from-[#1e1e1e] to-black">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    {/* Abstract Art / Gradient */}
                    <div className="w-[80%] h-[80%] bg-gradient-to-tr from-emerald-500/20 to-purple-500/20 rounded-full blur-[120px] animate-pulse" />

                    <div className="relative z-10 text-center p-12">
                        <h2 className="text-5xl font-bold text-white mb-6 leading-tight tracking-tighter">
                            Your digital brain,<br />
                            <span className="text-emerald-500">amplified.</span>
                        </h2>
                        <p className="text-[#b3b3b3] text-xl max-w-md mx-auto">
                            Capture, organize, and retrieve your knowledge with the speed of thought.
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

function LoginButton() {
    const { pending } = useFormStatus();

    return (
        <button
            className="w-full bg-emerald-500 text-black font-bold py-3.5 rounded-full hover:bg-emerald-400 hover:scale-105 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
            aria-disabled={pending}
            disabled={pending}
        >
            {pending && <Loader2 className="w-4 h-4 animate-spin" />}
            {pending ? 'LOGGING IN...' : 'LOG IN'}
        </button>
    );
}
