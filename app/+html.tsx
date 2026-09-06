import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <link rel="preload" href="/fonts/Geist-Regular.ttf" as="font" type="font/ttf" />
        <link rel="preload" href="/fonts/Geist-Medium.ttf" as="font" type="font/ttf" />
        <link rel="preload" href="/fonts/Geist-SemiBold.ttf" as="font" type="font/ttf" />
        <link rel="preload" href="/fonts/Geist-Bold.ttf" as="font" type="font/ttf" />
        <link rel="stylesheet" href="/fonts/geist.css" />
        <link rel="stylesheet" href="/fonts/future-type.css" />
        <link rel="stylesheet" href="/fonts/tap-cursor.css" />
        <style
          dangerouslySetInnerHTML={{
            __html: `button{border:none}[data-combo-chrome]{box-sizing:border-box!important;background-image:none!important;border-style:solid!important}[data-combo-chrome="unselected"]{background-color:transparent!important;border-width:1px!important;border-color:rgba(226,226,255,0.15)!important}[data-combo-chrome="selected"]{background-color:transparent!important;border-width:1px!important;border-color:transparent!important}[data-combo-chrome="muted"]{background-color:rgba(226,226,255,0.11)!important;border-width:0!important;border-color:transparent!important}`,
          }}
        />
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
