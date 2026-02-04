"use client";

import { usePathname } from "next/navigation";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthGuard } from "@/components/auth-guard";
import { CurrentUserProvider } from "@/hooks/use-current-user";

interface ProtectedLayoutProps {
  children: React.ReactNode;
}

// Public routes that don't require authentication
const publicRoutes = ["/login"];

export function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

  // Public routes - render without sidebar or auth guard
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Protected routes - render with sidebar, auth guard, and current user context
  return (
    <AuthGuard>
      <CurrentUserProvider>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
              <SidebarTrigger />
            </header>
            <main className="flex-1 p-6">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </CurrentUserProvider>
    </AuthGuard>
  );
}
