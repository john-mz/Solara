import type { Metadata } from "next";
import { DM_Sans, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/components/providers/app-providers";
import { ConditionalTopbar } from "@/components/layout/conditional-topbar";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-heading",
});

export const metadata: Metadata = {
  title: "Solara",
  description: "TINKU Hackathon — proyecto en desarrollo",
  manifest: "/favicon/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon/favicon.ico", sizes: "any" },
      { url: "/favicon/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/favicon/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/favicon/favicon.ico"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        "h-full min-h-0",
        "antialiased",
        dmSans.variable,
        plusJakartaSans.variable,
        "bg-background font-sans"
      )}
    >
      <body className="flex h-screen min-h-0 flex-col overflow-hidden">
        <AppProviders>
          <ConditionalTopbar />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
