import "./globals.css";

export const metadata = {
  title: "Aria — AI Refund Agent",
  description:
    "Aria is an AI-powered customer service agent that evaluates refund requests against company policy in real time.",
  keywords: ["refund", "AI agent", "customer service", "returns"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full antialiased">
        {children}
      </body>
    </html>
  );
}
