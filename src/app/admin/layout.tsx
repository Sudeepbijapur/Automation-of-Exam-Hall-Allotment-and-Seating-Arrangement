
'use client'
import ProtectedRoute from '@/components/auth/protected-route';
import AdminSidebar from '@/components/admin/sidebar';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription, SheetClose } from '@/components/ui/sheet';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-background">
        <div className="hidden md:flex">
          <AdminSidebar />
        </div>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden mb-4">
                  <Menu className="h-4 w-4" />
                  <span className="sr-only">Open sidebar</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-64">
                <SheetHeader className="sr-only">
                    <SheetTitle>Admin Menu</SheetTitle>
                    <SheetDescription>Navigation links for the admin dashboard.</SheetDescription>
                </SheetHeader>
              <SheetClose asChild>
                <AdminSidebar />
              </SheetClose>
            </SheetContent>
          </Sheet>
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
