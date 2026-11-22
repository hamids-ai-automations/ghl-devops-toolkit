import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://github.com/hamids-ai-automations/ghl-devops-toolkit"),
  title: {
    default: "GHL DevOps Toolkit - Open-Source Developer Platform for GoHighLevel",
    template: "%s | GHL DevOps Toolkit",
  },
  description:
    "Production-grade developer toolkit for building, testing, monitoring, and managing GoHighLevel automations. Featuring API Explorer, Webhook Inspector, Workflow Simulator, Automation Testing, Snapshot Validator, and AI Debugger.",
  applicationName: "GHL DevOps Toolkit",
  authors: [
    {
      name: "Muhammad Hamid (Marvis AI Automations)",
      url: "https://marvis.web.app/",
    },
  ],
  generator: "Next.js",
  keywords: [
    "GoHighLevel",
    "GHL",
    "GHL API Explorer",
    "LeadConnector API",
    "GoHighLevel DevOps",
    "CRM Automation Testing",
    "Webhook Inspector",
    "GHL Webhook Debugger",
    "Workflow Simulator",
    "Snapshot Validator",
    "AI Debugger",
    "GoHighLevel Open Source",
    "CRM Observability",
    "AI Automation Engineer",
    "Muhammad Hamid",
    "Marvis AI Automations",
  ],
  creator: "Muhammad Hamid",
  publisher: "Marvis AI Automations",
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
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "GHL DevOps Toolkit - Developer Platform for GoHighLevel",
    description:
      "Inspect APIs, debug webhooks, simulate lead workflows, run regression tests, validate snapshots, and troubleshoot GoHighLevel integrations with AI.",
    url: "https://github.com/hamids-ai-automations/ghl-devops-toolkit",
    siteName: "GHL DevOps Toolkit",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "GHL DevOps Toolkit - Developer Platform for GoHighLevel",
    description:
      "Inspect APIs, debug webhooks, simulate workflows, run automated tests, and troubleshoot with AI for GoHighLevel CRM.",
    creator: "@hamids_ai",
  },
  alternates: {
    canonical: "https://github.com/hamids-ai-automations/ghl-devops-toolkit",
  },
  other: {
    "contact:whatsapp": "+923167417135",
    "contact:portfolio": "https://marvis.web.app/",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "GHL DevOps Toolkit",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Windows, Linux, macOS, Docker",
  description:
    "The developer toolkit for building, testing, monitoring, and managing GoHighLevel automations.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  author: {
    "@type": "Person",
    name: "Muhammad Hamid",
    jobTitle: "AI Automation Engineer",
    url: "https://marvis.web.app/",
    telephone: "+923167417135",
  },
  contactPoint: {
    "@type": "ContactPoint",
    telephone: "+923167417135",
    contactType: "technical support",
    availableLanguage: ["English", "Urdu"],
  },
  softwareRequirements: "Node.js 20+, Docker (optional)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
