'use server';

import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

export async function authenticate(
    prevState: string | undefined,
    formData: FormData,
) {
    try {
        await signIn('credentials', { ...Object.fromEntries(formData), redirectTo: '/' });
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case 'CredentialsSignin':
                    return 'Invalid credentials.';
                default:
                    return 'Something went wrong.';
            }
        }
        throw error;
    }
}

export async function deleteTweet(id: string) {
    try {
        await prisma.tweet.delete({
            where: { id },
        });
        revalidatePath('/');
        return { message: 'Deleted Tweet.' };
    } catch (error) {
        return { message: 'Database Error: Failed to Delete Tweet.' };
    }
}

export async function reprocessTweet(id: string) {
    try {
        await prisma.tweet.update({
            where: { id },
            data: { processed: false }
        });
        revalidatePath('/');
        return { message: 'Marked for reprocessing.' };
    } catch (error) {
        return { message: 'Database Error: Failed to update Tweet.' };
    }
}
