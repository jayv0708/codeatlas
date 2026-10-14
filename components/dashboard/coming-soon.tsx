import { Hourglass } from "lucide-react";

import { EmptyState } from "@/components/dashboard/empty-state";

interface ComingSoonProps {
  title: string;
  description?: string;
}

export function ComingSoon({ title, description }: ComingSoonProps) {
  return (
    <EmptyState
      icon={Hourglass}
      title={title}
      description={
        description ?? "This area is part of an upcoming milestone and will be built next."
      }
      actionHref="/dashboard"
      actionLabel="Back to Dashboard"
    />
  );
}
