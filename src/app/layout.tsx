import type { Metadata, Viewport } from 'next';
import './globals.css';
import ReduxProvider from '@/components/providers/ReduxProvider';
import FcmProvider   from '@/components/providers/FcmProvider';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'MatchCreatorz -- Connect. Create. Succeed.',
  description: 'The premier marketplace connecting talented creators with buyers.',
  icons: { icon: '/favicon.ico' },
};

// Without this, mobile browsers render at a desktop-width viewport (~980px)
// and scale the whole page down to fit — everything looks shrunk/squeezed on
// a real phone even though it renders correctly at the same CSS width in a
// devtools/emulator viewport, which honors the width directly.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
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
