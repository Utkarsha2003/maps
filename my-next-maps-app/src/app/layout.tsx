// src/app/layout.tsx
import "./globals.css";
import { ChakraProvider } from "@chakra-ui/react";
import { Collapse as ChakraCollapse } from '@chakra-ui/transition';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Maps App",
  description: "Google Maps Integration",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ChakraProvider>{children}</ChakraProvider>
      </body>
    </html>
  );
}
