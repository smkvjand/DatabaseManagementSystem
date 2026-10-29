import type { Metadata } from 'next';
import '../index.css';

export const metadata: Metadata = {
  title: 'reWear — Sustainable Clothing Exchange Platform',
  description: 'A student marketplace to buy, swap, and donate pre-loved clothing across campus.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#FAF9F6] text-[#1D1D1F] antialiased selection:bg-[#1D1D1F] selection:text-white">{children}</body>
    </html>
  );
}
