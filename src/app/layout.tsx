import type { Metadata } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "BC Quote Estimator | Technically Business Central",
  description:
    "AI-powered development time estimation for Business Central projects. Break down requirements into actionable tasks with accurate hour estimates.",
  keywords: [
    "Business Central",
    "BC Development",
    "Quote Estimator",
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
