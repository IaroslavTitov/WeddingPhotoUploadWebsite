/* eslint-disable @next/next/no-page-custom-font */
import { Suspense } from "react";
import "./globals.css";

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/images/sakura.png" sizes="any" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" />
                <link href="https://fonts.googleapis.com/css2?family=Allura&family=Onest&display=swap" rel="stylesheet" />
            </head>
            <body>
                <Suspense>{children}</Suspense>
            </body>
        </html>
    );
}
