import { AircallLoader } from "@/components/ui/AircallLoader";

export default function RootLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#F0F0F0]">
      <AircallLoader size="md" />
    </div>
  );
}
