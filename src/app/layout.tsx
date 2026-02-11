import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "BC Project Tools | Technically Business Central",
  description:
    "AI-powered project tools for Business Central — estimate development time and review specifications for quality before development starts.",
  keywords: [
    "Business Central",
    "BC Development",
    "Quote Estimator",
    "Spec Review",
    "Project Estimation",
    "AL Development",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="bottom-right"
          theme="dark"
          richColors
        />
      </body>
    </html>
  );
}
