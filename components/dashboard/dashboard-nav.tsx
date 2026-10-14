"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  MessageSquare,
  GitBranch,
  Zap,
  Brain,
  FileText,
  Settings,
  Shield,
  Menu,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { title: "Repositories", href: "/repositories", icon: <FolderOpen size={18} /> },
  { title: "Chat", href: "/chat", icon: <MessageSquare size={18} /> },
  { title: "Architecture", href: "/architecture", icon: <GitBranch size={18} /> },
  { title: "Impact Analysis", href: "/impact", icon: <Zap size={18} /> },
  { title: "AI Insights", href: "/ai-insights", icon: <Brain size={18} /> },
];

const BOTTOM_ITEMS: NavItem[] = [
  { title: "Docs", href: "/docs", icon: <FileText size={18} /> },
  { title: "Settings", href: "/settings", icon: <Settings size={18} /> },
];

function NavLinks({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            prefetch={true}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors",
              isActive
                ? "text-[#aa3000]"
                : "text-[#8b949e] hover:text-white hover:bg-white/5"
            )}
            style={isActive ? { background: 'rgba(226,226,232,0.1)' } : undefined}
          >
            <span className="flex-shrink-0" aria-hidden="true">
              {item.icon}
            </span>
            <span className="text-sm">{item.title}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="hidden lg:flex w-[280px] flex-shrink-0 border-r flex-col h-screen fixed inset-y-0 left-0 z-50 overflow-y-auto"
      style={{
        background: '#0c0e12',
        borderColor: 'rgba(255,255,255,0.05)',
      }}
    >
      <div className="p-6">
        <Link href="/" className="flex items-center gap-3 mb-10" aria-label="CodeAtlas home">
          <Image
            src="/favicon.png"
            alt="CodeAtlas"
            width={32}
            height={32}
            className="h-8 w-8 object-contain"
          />
          <span className="font-bold text-lg tracking-tight text-white">CodeAtlas</span>
        </Link>

        <div className="mb-4">
          <p className="font-mono text-xs font-semibold uppercase tracking-wider mb-4 px-3"
             style={{ color: '#8b949e' }}>
            Navigation
          </p>
          <NavLinks pathname={pathname} />
        </div>
      </div>

      {/* Prefetch critical routes */}
      <div className="hidden">
        <Link href="/repositories" prefetch={true} />
        <Link href="/chat" prefetch={true} />
        <Link href="/architecture" prefetch={true} />
        <Link href="/impact" prefetch={true} />
        <Link href="/ai-insights" prefetch={true} />
        <Link href="/settings" prefetch={true} />
      </div>

      <div className="mt-auto p-6 flex flex-col gap-1 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        {BOTTOM_ITEMS.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                isActive ? 'text-[#aa3000]' : 'text-[#8b949e] hover:text-white hover:bg-white/5'
              }`}
              style={isActive ? { background: 'rgba(226,226,232,0.1)' } : undefined}
            >
              <span className="flex-shrink-0" aria-hidden="true">
                {item.icon}
              </span>
              <span className="text-sm">{item.title}</span>
            </Link>
          );
        })}
        <div className="mb-4" />

        {/* Beta Badge */}
        <div className="rounded-xl p-4 flex flex-col gap-2"
             style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="flex items-center gap-2">
            <Shield size={14} style={{ color: '#aa3000' }} />
            <span className="font-mono text-xs font-bold tracking-widest uppercase" style={{ color: '#aa3000' }}>
              Beta
            </span>
          </div>
          <p className="text-sm mt-1" style={{ color: '#8b949e' }}>
            Connect a repository to start indexing.
          </p>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();
  return (
    <Dialog>
      <DialogTrigger
        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border lg:hidden"
        style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)' }}
        aria-label="Open navigation"
      >
        <Menu size={18} className="text-[#8b949e]" />
      </DialogTrigger>
      <DialogContent
        className="max-w-[280px] border-0 sm:max-w-[280px]"
        style={{ background: '#111317', borderColor: 'rgba(255,255,255,0.08)' }}
      >
        <DialogHeader>
          <DialogTitle className="sr-only">Navigation</DialogTitle>
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/favicon.png" alt="CodeAtlas" width={28} height={28} className="h-6 w-6 rounded-md object-contain" />
            <span className="text-sm font-bold text-white">CodeAtlas</span>
          </Link>
        </DialogHeader>
        <div className="pt-2">
          <NavLinks pathname={pathname} />
        </div>
        <div className="pt-2 border-t" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
          {BOTTOM_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${
                  isActive ? 'text-[#aa3000]' : 'text-[#8b949e] hover:text-white hover:bg-white/5'
                }`}
                style={isActive ? { background: 'rgba(226,226,232,0.1)' } : undefined}
              >
                <span className="flex-shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="text-sm">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
