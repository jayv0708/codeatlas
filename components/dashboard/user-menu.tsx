"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

interface UserMenuProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

function UserAvatar({ user }: { user: UserMenuProps["user"] }) {
  const [imgFailed, setImgFailed] = useState(false);
  const showImage = user.image && !imgFailed;

  if (showImage) {
    return (
      <img
        src={user.image!}
        alt={user.name || "User"}
        className="h-8 w-8 rounded-full object-cover"
        onError={() => setImgFailed(true)}
      />
    );
  }

  return (
    <div
      className="h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium"
      style={{ background: 'rgba(170,48,0,0.2)', color: '#ffb59e' }}
    >
      {user.name?.charAt(0)?.toUpperCase() || "U"}
    </div>
  );
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <UserAvatar user={user} />
        <div className="hidden sm:block">
          <p className="text-sm font-medium text-white">{user.name}</p>
          <p className="text-xs" style={{ color: '#8b949e' }}>{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/settings"
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: '#8b949e' }}
        >
          <span className="material-symbols-outlined">settings</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="p-2 rounded-lg transition-colors hover:bg-white/5"
          style={{ color: '#8b949e' }}
        >
          <span className="material-symbols-outlined">logout</span>
        </button>
      </div>
    </div>
  );
}
