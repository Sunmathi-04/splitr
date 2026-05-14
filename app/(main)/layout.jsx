/*"use client";

import Header from "@/components/header";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { useStoreUser } from "@/hooks/use-store-user";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL
);

export default function MainLayout({ children }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <MainContent>{children}</MainContent>
    </ConvexProviderWithClerk>
  );
}

function MainContent({ children }) {
  useStoreUser(); // ✅ Convex + Clerk both available

  return (
    <>
      <Header />
      <main className="pt-24">{children}</main>
    </>
  );
}
*/

/*
import { ClerkProvider } from "@clerk/nextjs";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <ClerkProvider>
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}
*/
/*"use client";

import Header from "@/components/header";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { SignedIn, useAuth } from "@clerk/nextjs"; // ✅ FIXED
import { useStoreUser } from "@/hooks/use-store-user";

const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL
);

function StoreUserGate({ children }) {
  useStoreUser();
  return children;
}

export default function MainLayout({ children }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <SignedIn>
        <StoreUserGate>
          <Header />
          <main className="pt-24">{children}</main>
        </StoreUserGate>
      </SignedIn>
    </ConvexProviderWithClerk>
  );
}
*/const MainLayout = ({ children }) => {
  return (
    <div className="container mx-auto mt-24 mb-20 px-4">
      {children}
    </div>
  );
};

export default MainLayout;
