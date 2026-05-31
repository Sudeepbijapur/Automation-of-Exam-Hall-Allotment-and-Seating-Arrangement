
"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  LogOut,
  School,
  Users,
  ClipboardList,
  ChevronDown,
  BookMarked,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/classes', label: 'Classes', icon: School },
  { href: '/admin/batches', label: 'Batches', icon: Users },
  { href: '/admin/electives', label: 'Electives', icon: BookMarked },
  { href: '/admin/invigilators', label: 'Invigilators', icon: UserCog },
  { href: '/admin/exams', label: 'Exams', icon: ClipboardList },
];

export default function AdminSidebar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleSignOut = async () => {
    await signOut(auth);
    router.push('/login');
  };

  return (
    <aside className="w-full h-full flex-shrink-0 bg-card p-4 flex flex-col">
      <div className="flex items-center gap-3 mb-8">
         <div className="p-2 bg-primary rounded-lg">
           <span className="font-bold text-2xl text-primary-foreground">🎓</span>
         </div>
        <h1 className="font-headline text-xl font-bold">FindMySeat</h1>
      </div>
      <nav className="flex-grow">
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary hover:bg-accent/20',
                  (pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))) && 'bg-primary/10 text-primary font-semibold'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-between h-auto p-2">
              <div className="flex items-center gap-2 text-left overflow-hidden">
                <Avatar className="h-9 w-9">
                   <AvatarFallback>{user?.email?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start overflow-hidden">
                  <span className="text-sm font-medium leading-none truncate">Admin</span>
                   <span className="text-xs text-muted-foreground leading-none truncate">{user?.email}</span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Administrator</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
