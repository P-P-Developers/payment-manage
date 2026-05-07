import './globals.css';

export const metadata = {
  title: 'Panel Sales Accounting System',
  description: 'Secure accounting and digitization system for panel software sales',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
