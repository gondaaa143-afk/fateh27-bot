import "./globals.css";

export const metadata = {
  title: "FATEH27",
  description: "UPSC Command Center",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
