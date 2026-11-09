import { BottomNav } from "@/components/bottom-nav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="mx-auto w-full max-w-xl flex-1 px-4 pb-28 pt-5">{children}</main>
      <BottomNav />
    </>
  );
}
