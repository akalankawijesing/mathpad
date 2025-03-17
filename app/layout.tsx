import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import '@mantine/core/styles.css';
import { MantineProvider} from "@mantine/core";
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
  title: "MathPad - Mathematical Expression Evaluator",
  description: "Mathematical Expression Evaluator",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
         <MantineProvider>
        {children}
        </MantineProvider>
      </body>
    </html>
  );
}
