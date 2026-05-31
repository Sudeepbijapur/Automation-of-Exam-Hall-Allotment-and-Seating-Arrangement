import type { Metadata } from 'next';
import { Poppins, Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import AuthProvider from '@/components/auth/auth-provider';

const fontInter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});

const fontPoppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-headline',
});

export const metadata: Metadata = {
  title: 'FindMySeat',
  description:
    'Effortless exam seat allocation and student lookup.',
  icons: [{ rel: "icon", url: "data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100%22><text y=%22.9em%22 font-size=%2290%22>🎓</text></svg>" }]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          'min-h-screen bg-background font-body antialiased',
          fontInter.variable,
          fontPoppins.variable
        )}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
