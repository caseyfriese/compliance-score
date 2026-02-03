import "./globals.css";

export const metadata = {
  title: "Compliance Score",
  description: "A 60-second reality check for people responsible for risk.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      {/* Force dark by default */}
      <body>{children}</body>
    </html>
  );
}
