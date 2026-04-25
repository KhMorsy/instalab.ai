import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'InstaLab AI Scientist',
  description: 'Multi-agent literature QC and operational experiment planning.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
