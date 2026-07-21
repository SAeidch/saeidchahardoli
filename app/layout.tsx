import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { profile } from "@/data/profile";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://saeidchahardoli.com"),
  title: `${profile.name} — ${profile.roles[0]}`,
  description: profile.intro,
  keywords: [
    "Saeid Chahardoli",
    "AI researcher",
    "robotics",
    "data scientist",
    "CFD",
    "indoor air quality",
    "HVAC",
    "machine learning",
    "generative art",
    "strange attractor",
    "Louisiana State University",
  ],
  authors: [{ name: profile.name }],
  openGraph: {
    title: `${profile.name} — ${profile.roles[0]}`,
    description: profile.tagline,
    type: "website",
    url: "https://saeidchahardoli.com",
  },
  twitter: {
    card: "summary_large_image",
    title: `${profile.name} — ${profile.roles[0]}`,
    description: profile.tagline,
  },
};

// Next 16: themeColor / colorScheme belong in the viewport export, not metadata.
// Both themes are declared so the browser chrome matches the active theme.
export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f3ee" },
    { media: "(prefers-color-scheme: dark)", color: "#0e0f14" },
  ],
};

/**
 * Runs before first paint to set data-theme from storage or system preference,
 * so there's no light-mode flash before hydration. Kept tiny and dependency-free.
 * suppressHydrationWarning on <html> tells React the attribute is set out-of-band.
 */
const themeInitScript = `
(function () {
  try {
    var stored = localStorage.getItem("theme");
    var system = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    document.documentElement.dataset.theme = stored === "light" || stored === "dark" ? stored : system;
  } catch (e) {
    document.documentElement.dataset.theme = "light";
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} antialiased`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
      </body>
    </html>
  );
}
