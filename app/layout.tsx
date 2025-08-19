import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Building complex multi-agent orchestrations and making all your customer\'s dreams come true',
  description: 'Building stuff is hard. Building stuff using LLMs is harder. Between non-determinism and quality control, you\'ve already got your hands full. Also, many folks have no idea what \'multi-agent orchestration\' is. In this level 101 class we explore what we\'re really talking about and provide concrete examples on how to implement them from first principles. welcome no the framework zone.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}