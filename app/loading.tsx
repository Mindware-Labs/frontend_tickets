import { EntityLoadingSpinner } from "@/components/shared/entity-loading-state";

export default function RootLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#f4f5f7] dark:bg-neutral-950">
      <EntityLoadingSpinner kind="dashboard" size="lg" />
    </div>
  );
}
