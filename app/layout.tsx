import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { RouteLoader } from '@/components/RouteLoader'
import { ThemeProviderClient } from '@/components/ThemeProviderClient'
import { MoodManager } from '@/components/MoodManager'

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ExpenseTracker - Smart Finance Management',
  description: 'Track expenses, manage budgets, and get AI-powered insights to make smarter financial decisions.',
  keywords: ['expense tracker', 'budget management', 'personal finance', 'AI insights', 'financial planning'],
  authors: [{ name: 'ExpenseTracker Team' }],
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">💰</text></svg>',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ThemeProviderClient>
          <RouteLoader />
          <MoodManager />
          {children}
        </ThemeProviderClient>
      </body>
    </html>
  );
}
