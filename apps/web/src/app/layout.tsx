import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "cashBot",
  description: "Personal finance tracker with Telegram sync"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" className="antialiased">
      <body className="min-h-screen bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(99,102,241,0.15),transparent_60%),radial-gradient(900px_500px_at_10%_10%,rgba(16,185,129,0.12),transparent_55%),radial-gradient(900px_500px_at_90%_10%,rgba(244,63,94,0.10),transparent_55%)] text-zinc-900 dark:bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(99,102,241,0.18),transparent_60%),radial-gradient(900px_500px_at_10%_10%,rgba(16,185,129,0.12),transparent_55%),radial-gradient(900px_500px_at_90%_10%,rgba(244,63,94,0.12),transparent_55%)] dark:text-zinc-100">
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(()=>{try{const t=localStorage.getItem('theme');const d=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches;const theme=t||(d?'dark':'light');if(theme==='dark')document.documentElement.classList.add('dark');}catch(e){}})();"
          }}
        />
        {children}
      </body>
    </html>
  );
}

