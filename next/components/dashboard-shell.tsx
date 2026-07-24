"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/brand-logo";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getPageTitle, navigation } from "@/lib/navigation";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const pageTitle = getPageTitle(pathname);

  return (
    <SidebarProvider>
      <DashboardSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b bg-background/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <SidebarTrigger />
            <Separator orientation="vertical" className="h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden sm:inline-flex">
                  <Link href="/organizer" className="text-muted-foreground hover:text-foreground">Organizer</Link>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{pageTitle}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-6 px-3 pb-6 pt-4 sm:px-6 sm:pb-6 lg:px-8 lg:pb-8">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function DashboardSidebar() {
  const pathname = usePathname();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" render={<Link href="/organizer" onClick={() => setOpenMobile(false)} />} tooltip="Sports Fiesta">
              <BrandLogo className="group-data-[collapsible=icon]:[&>span:last-child]:hidden" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        {navigation.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={pathname === item.href || (item.href !== "/organizer" && pathname.startsWith(`${item.href}/`))}
                        tooltip={item.title}
                        render={<Link href={item.href} onClick={() => setOpenMobile(false)} />}
                      >
                        <Icon />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-2">
        <Dialog>
          <DialogTrigger render={<Button type="button" variant="ghost" size="sm" className="w-full justify-start text-xs font-medium text-muted-foreground/35 transition-opacity hover:text-muted-foreground group-data-[collapsible=icon]:size-8 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0" />}>
            <span className="group-data-[collapsible=icon]:hidden">who?</span>
            <span className="hidden text-sm group-data-[collapsible=icon]:inline">?</span>
          </DialogTrigger>
          <DialogContent className="max-h-[85dvh] max-w-lg overflow-y-auto p-0 sm:max-w-2xl" showCloseButton>
            <div className="p-5 sm:p-6">
              <DialogHeader>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">The small answer</p>
                <DialogTitle className="text-2xl font-bold">Who made this?</DialogTitle>
                <DialogDescription className="max-w-xl leading-6">Daniel and Patrick. Between college work and long, tiring nights, we kept cooking ideas and turning them into code until Sports Fiesta was ready.</DialogDescription>
              </DialogHeader>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <figure className="overflow-hidden rounded-2xl border bg-muted/20">
                  <Image src="/story/building-sports-fiesta.jpeg" alt="Daniel and Patrick building Sports Fiesta late at night" width={1440} height={1080} className="aspect-[4/3] w-full object-cover" />
                  <figcaption className="px-3 py-2 text-xs text-muted-foreground">Countless hours of planning, fixing, and building.</figcaption>
                </figure>
                <figure className="overflow-hidden rounded-2xl border bg-muted/20">
                  <Image src="/story/cooking-sports-fiesta.jpeg" alt="Daniel and Patrick cooking together" width={1086} height={1448} className="aspect-[4/3] w-full object-cover" />
                  <figcaption className="px-3 py-2 text-xs text-muted-foreground">A reminder that we really cooked this one.</figcaption>
                </figure>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
