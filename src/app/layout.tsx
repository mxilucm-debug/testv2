import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HRMS - Human Resource Management System",
  description: "Modern HRMS with workspace-based architecture, role-based dashboards, and comprehensive employee management.",
  keywords: ["HRMS", "Human Resources", "Employee Management", "Next.js", "TypeScript", "Tailwind CSS"],
  authors: [{ name: "HRMS Team" }],
  openGraph: {
    title: "HRMS - Human Resource Management System",
    description: "Modern HR management with workspace-based architecture",
    url: "https://hrms.example.com",
    siteName: "HRMS",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "HRMS - Human Resource Management System",
    description: "Modern HR management with workspace-based architecture",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
