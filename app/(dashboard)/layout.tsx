import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <nav className="flex items-center gap-6">
            <Link href="/" className="font-semibold text-lg">meta-manage</Link>
            <Link href="/queue" className="text-sm text-muted-foreground hover:text-foreground">예약 큐</Link>
            <Link href="/comments" className="text-sm text-muted-foreground hover:text-foreground">댓글 승인</Link>
            <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground">설정</Link>
          </nav>
          <SignOutButton />
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
