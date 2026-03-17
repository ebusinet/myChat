import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'myChat Test Dashboard',
  description: 'Test application for @mychat library',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <nav className="top-nav">
          <div className="nav-brand">myChat</div>
          <div className="nav-links">
            <Link href="/">Dashboard</Link>
            <Link href="/config">Config</Link>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
