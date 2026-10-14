import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/page-header";
import { requireSession } from "@/lib/session";
import { SettingsContent } from "@/components/dashboard/settings-view";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  const session = await requireSession();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Settings"
        description="Manage your account, GitHub connection, and preferences."
      />
      <SettingsContent user={session.user} />
    </div>
  );
}
