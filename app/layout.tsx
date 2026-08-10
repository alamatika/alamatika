import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Alamatika",
    template: "%s | Alamatika",
  },

  description:
    "Read Alamatika, a Filipino mythology manga inspired by ancient legends, gods, spirits, and forgotten tales.",

  keywords: [
    "Alamatika",
    "Filipino mythology",
    "Philippine mythology",
    "manga",
    "webcomic",
    "comic",
    "Bathala",
    "Philippines",
    "fantasy",
    "gods",
    "angels",
    "alamat",
    "myth",
    "filipino manga",
    "gala",
    "bayani",
    "ligaya",
    "albularyo",
    "mt. mani",
    "pasig",
    "mestiso",
    "mestisa",
    "huni",
    "ulilang kaluluwa",
    "galang kaluluwa",
    "abyan",
    "ai assissted manga",
    "elf",
    "dwende",
    "dwarf",
  ],

  icons: {
    icon: "/favicon.ico",
  },

  openGraph: {
    title: "Alamatika",
    description:
      "Read Alamatika, a Filipino mythology manga inspired by ancient legends.",
    images: ["/logos/alamatika-logo-gold1.png"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
