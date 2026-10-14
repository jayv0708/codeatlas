"use client";

import { FileText, LayoutDashboard, LogIn, Network, Package, Sparkles, User } from "lucide-react";

import { Dock, DockIcon, DockItem, DockLabel } from "@/components/core/dock";

type User = {
  name?: string | null;
  email?: string | null;
  image?: string | null;
};

interface StitchHeaderDockProps {
  user?: User | null;
}

/**
 * Top navigation for the Stitch header — an Apple-style dock. Items magnify on
 * hover and reveal their label. When signed in, shows user name and Dashboard link.
 */
export function StitchHeaderDock({ user }: StitchHeaderDockProps) {
  const isSignedIn = !!user;
  const firstName = user?.name?.split(/\s+/)[0] ?? null;

  const DOCK_ITEMS = [
    { title: "Product", href: "/#product", icon: Package },
    { title: "Architecture", href: "/#architecture", icon: Network },
    { title: "Features", href: "/#features", icon: Sparkles },
    { title: "Docs", href: "/docs", icon: FileText },
    isSignedIn
      ? { title: firstName ?? "Dashboard", href: "/dashboard", icon: LayoutDashboard }
      : { title: "Sign In", href: "/login", icon: LogIn },
  ] as const;

  return (
    <Dock className="items-end pb-3 bg-neutral-900">
      {DOCK_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <DockItem
            key={item.title}
            href={item.href}
            className="aspect-square rounded-full bg-neutral-800"
          >
            <DockLabel className="border-neutral-900 bg-neutral-800 text-white">
              {item.title}
            </DockLabel>
            <DockIcon>
              {isSignedIn && item.title === (firstName ?? "Dashboard") ? (
                user?.image ? (
                  <img
                    src={user.image}
                    alt={user.name ?? "User"}
                    className="h-full w-full rounded-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className="h-5 w-5 text-neutral-300" aria-hidden="true" />
                  </div>
                )
              ) : (
                <Icon className="h-full w-full text-neutral-300" aria-hidden="true" />
              )}
            </DockIcon>
          </DockItem>
        );
      })}
    </Dock>
  );
}
