import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Project estimator | Cynbit Technologies (prototype)",
  description: "Pick what you want to build and see an indicative price range and timeline in seconds.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN">
      <body>{children}</body>
    </html>
  );
}
