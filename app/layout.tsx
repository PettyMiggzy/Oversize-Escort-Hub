import "./globals.css";

export const metadata = {
  title: "Oversize Escort Hub",
  description: "Live • Ranked • Verified marketplace for oversize escort work",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
