import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Navbar from "@/components/Navbar";
import ThemeWrapper from "@/components/ThemeWrapper";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  const userId = (session.user as { id?: string })?.id;
  const userTheme = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { themeAccent: true, themeBg: true, themeBgImage: true, themeAnimation: true },
      })
    : null;

  const initial = {
    accent: userTheme?.themeAccent ?? "#4ade80",
    bg: userTheme?.themeBg ?? "default",
    bgImage: userTheme?.themeBgImage ?? null,
    animation: userTheme?.themeAnimation ?? "rings",
  };

  return (
    <div className="min-h-screen flex flex-col relative">
      <ThemeWrapper initial={initial} />
      <div className="relative flex flex-col min-h-screen" style={{ zIndex: 10 }}>
        <Navbar user={session.user as { name?: string; email?: string; role?: string }} />
        <main className="flex-1 container mx-auto px-4 py-6 max-w-7xl pb-24 sm:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
