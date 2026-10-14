"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  FolderGit2,
  Shield,
  Trash2,
  X,
} from "lucide-react";

interface SettingsContentProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl border p-6"
      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      <div className="mb-5">
        <h2 className="text-base font-semibold" style={{ color: '#f4f2eb' }}>{title}</h2>
        <p className="mt-1 text-xs" style={{ color: '#a3a19c' }}>{description}</p>
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider" style={{ color: '#a3a19c' }}>
      {children}
    </label>
  );
}

function TextInput({
  value,
  placeholder,
  readOnly,
}: {
  value: string;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <input
      type="text"
      defaultValue={value}
      placeholder={placeholder}
      readOnly={readOnly}
      className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
        color: '#f4f2eb',
      }}
    />
  );
}

function DeleteConfirmDialog({
  open,
  onConfirm,
  onCancel,
  deleting,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md rounded-xl border p-6"
        style={{ background: '#1a1c2e', borderColor: 'rgba(224,109,123,0.2)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ background: 'rgba(224,109,123,0.12)' }}
          >
            <Trash2 className="h-5 w-5" style={{ color: '#e06d7b' }} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: '#f4f2eb' }}>Delete Account</h3>
        </div>
        <p className="mb-6 text-sm leading-relaxed" style={{ color: '#a3a19c' }}>
          This permanently deletes your CodeAtlas account and all associated data including repositories,
          conversations, and analysis history. This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#f4f2eb', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors"
            style={{
              background: deleting ? 'rgba(224,109,123,0.06)' : 'rgba(224,109,123,0.15)',
              color: '#e06d7b',
              border: '1px solid rgba(224,109,123,0.25)',
              opacity: deleting ? 0.6 : 1,
            }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            {deleting ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="ml-2 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs transition-colors"
      style={{ color: copied ? '#6dd5a0' : '#a3a19c', background: 'rgba(255,255,255,0.05)' }}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

export function SettingsContent({ user }: SettingsContentProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeleteAccount() {
    setDeleting(true);
    try {
      const res = await fetch("/api/user/delete", { method: "DELETE" });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json().catch(() => null);
        alert(data?.error || "Failed to delete account. Please try again.");
        setDeleting(false);
        setDeleteDialogOpen(false);
      }
    } catch {
      alert("Failed to delete account. Please try again.");
      setDeleting(false);
      setDeleteDialogOpen(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile */}
      <SettingsSection title="Profile" description="Your account information from your connected OAuth provider.">
        <div className="flex items-center gap-4 mb-6">
          <div
            className="flex h-14 w-14 items-center justify-center rounded-full text-lg font-bold"
            style={{ background: 'rgba(255,181,158,0.12)', color: '#ffb59e' }}
          >
            {user.name?.split(/\s+/).map(p => p[0]).join("").slice(0, 2).toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-sm font-medium" style={{ color: '#f4f2eb' }}>{user.name ?? "Anonymous"}</p>
            <p className="text-xs" style={{ color: '#a3a19c' }}>{user.email ?? "No email"}</p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Display Name</FieldLabel>
            <TextInput value={user.name ?? ""} placeholder="Your name" />
          </div>
          <div>
            <FieldLabel>Email</FieldLabel>
            <TextInput value={user.email ?? ""} readOnly />
          </div>
        </div>
      </SettingsSection>

      {/* GitHub Connection */}
      <SettingsSection title="GitHub Connection" description="Manage your GitHub OAuth connection and repository access.">
        <div className="flex items-center gap-3 rounded-lg p-4" style={{ background: 'rgba(109,213,160,0.06)', border: '1px solid rgba(109,213,160,0.12)' }}>
          <Shield className="h-5 w-5" style={{ color: '#6dd5a0' }} />
          <div>
            <p className="text-sm font-medium" style={{ color: '#f4f2eb' }}>GitHub Connected</p>
            <p className="text-xs" style={{ color: '#a3a19c' }}>Repository access scope: <code className="rounded px-1 py-0.5 text-[11px]" style={{ background: 'rgba(255,255,255,0.06)' }}>read:user user:email repo</code></p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors"
            style={{ background: 'rgba(255,255,255,0.05)', color: '#f4f2eb', border: '1px solid rgba(255,255,255,0.08)' }}
          >
            <FolderGit2 className="h-3.5 w-3.5" />
            Manage Repositories
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors"
            style={{ background: 'rgba(224,109,123,0.08)', color: '#e06d7b', border: '1px solid rgba(224,109,123,0.15)' }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Disconnect
          </button>
        </div>
      </SettingsSection>

      {/* Danger Zone */}
      <div className="rounded-xl border p-6" style={{ background: 'rgba(224,109,123,0.03)', borderColor: 'rgba(224,109,123,0.12)' }}>
        <div className="mb-4">
          <h2 className="text-base font-semibold" style={{ color: '#e06d7b' }}>Danger Zone</h2>
          <p className="mt-1 text-xs" style={{ color: '#a3a19c' }}>Irreversible actions that affect your account.</p>
        </div>
        <div className="flex items-center justify-between rounded-lg p-4" style={{ background: 'rgba(224,109,123,0.05)', border: '1px solid rgba(224,109,123,0.1)' }}>
          <div>
            <p className="text-sm font-medium" style={{ color: '#f4f2eb' }}>Delete Account</p>
            <p className="text-xs" style={{ color: '#a3a19c' }}>Permanently remove your account and all data.</p>
          </div>
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition-colors"
            style={{ background: 'rgba(224,109,123,0.12)', color: '#e06d7b', border: '1px solid rgba(224,109,123,0.2)' }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Account
          </button>
        </div>
      </div>

      {/* Save */}
      <div className="flex justify-end">
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold transition-all hover:brightness-110"
          style={{ background: '#ffb59e', color: '#0f111a' }}
        >
          Save Changes
        </button>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onConfirm={handleDeleteAccount}
        onCancel={() => { setDeleteDialogOpen(false); setDeleting(false); }}
        deleting={deleting}
      />
    </div>
  );
}
