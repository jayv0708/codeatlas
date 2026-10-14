"use client";

import { useEffect, useState } from "react";

import { StitchHeaderDock } from "@/components/site/stitch/stitch-header-dock";

/**
 * Client-side header dock that fetches the session asynchronously.
 * The marketing layout renders instantly without waiting for auth.
 * The dock hydrates with user data after the session loads.
 */
export function StitchHeaderDockClient() {
  const [user, setUser] = useState<{
    name?: string | null;
    email?: string | null;
    image?: string | null;
  } | null>(null);

  useEffect(() => {
    // Fetch session from NextAuth API endpoint (no blocking SSR)
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (data?.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Not signed in or network error — leave user as null
      });
  }, []);

  return <StitchHeaderDock user={user} />;
}
