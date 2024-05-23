// cleaner SEO in nextjs

import { ClerkProvider } from '@clerk/nextjs'
import { dark } from '@clerk/themes';
import { Inter } from 'next/font/google';
import Head from "next/head";

import '../globals.css';

export const metadata = {
    title: 'Threads',
    description: 'A social media platform for developers',
    keywords: ['social media', 'developers', 'programming', 'coding'],
};

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <ClerkProvider
            appearance={{
                baseTheme: dark,
            }}
        >
            <html lang="cs">
                <Head>
                    <title>{metadata.title}</title>
                    <meta name="description" content={metadata.description} />
                    <meta name="keywords" content={metadata.keywords.join(', ')} />
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <body className={`${inter.className} bg-dark-1`}>
                    <div className='w-full flex justify-center items-center min-h-screen'>
                        {children}
                    </div>
                </body>
            </html>
        </ClerkProvider>
    );
}
