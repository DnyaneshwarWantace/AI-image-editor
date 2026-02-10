import type { Metadata } from "next";
import { Inter, Outfit, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"], variable: '--font-inter' });
const outfit = Outfit({ subsets: ["latin"], variable: '--font-outfit' });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: '--font-space-grotesk' });

export const metadata: Metadata = {
  title: {
    default: "AI Image Editor - Professional Design Tool with AI Features",
    template: "%s | AI Image Editor"
  },
  description: "Create stunning designs with our AI-powered image editor. Features include background removal, object detection, face recognition, templates, and professional editing tools. Free online design tool.",
  keywords: [
    "AI image editor",
    "photo editor",
    "background removal",
    "design tool",
    "online editor",
    "AI design",
    "image editing",
    "photo editing software",
    "free image editor",
    "graphic design tool"
  ],
  authors: [{ name: "AI Image Editor" }],
  creator: "AI Image Editor",
  publisher: "AI Image Editor",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "AI Image Editor - Professional Design Tool",
    description: "Create stunning designs with AI-powered tools including background removal, object detection, and professional templates",
    siteName: "AI Image Editor",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Image Editor - Professional Design Tool",
    description: "Create stunning designs with AI-powered editing tools",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable} ${spaceGrotesk.variable}`}>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}


