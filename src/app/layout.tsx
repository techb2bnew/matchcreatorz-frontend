import type { Metadata } from 'next';
import './globals.css';
import ReduxProvider from '@/components/providers/ReduxProvider';
import FcmProvider   from '@/components/providers/FcmProvider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'MatchCreatorz -- Connect. Create. Succeed.',
  description: 'The premier marketplace connecting talented creators with buyers.',
  icons: { icon: '/favicon.ico' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/devicons/devicon@latest/devicon.min.css"
        />
      </head>
      <body className="min-h-full antialiased" suppressHydrationWarning>
        <ReduxProvider>
          <FcmProvider>
          {children}
          </FcmProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: { borderRadius: '10px', background: '#111827', color: '#fff', fontSize: '14px' },
              success: { iconTheme: { primary: '#e84545', secondary: '#fff' } },
            }}
          />
        </ReduxProvider>
      </body>
    </html>
  );
}
