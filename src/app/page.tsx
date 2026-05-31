
import StudentSearch from '@/components/student/student-search';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Shield } from 'lucide-react';
import Image from 'next/image';

function Header() {
    return (
        <header className="w-full bg-white text-black py-2 px-2 sm:px-4 border-b-[3px] border-yellow-400">
            <div className="flex flex-row justify-between items-center gap-2 sm:gap-4">
                <div className="text-center">
                    <Image
                      src="https://i.postimg.cc/x8hCX5nT/Untitled-design-3.png"
                      alt="SKSVMA Logo"
                      width={100}
                      height={100}
                      className="w-16 h-16 sm:w-24 sm:h-24 mx-auto"
                      data-ai-hint="logo"
                    />
                    <p className="text-[10px] sm:text-xs mt-1">ESTD:2003</p>
                    <p className="text-[10px] sm:text-xs">ISO 9001:2015</p>
                </div>
                <div className="text-center flex-grow px-1">
                    <h1 className="text-sm sm:text-base md:text-2xl font-bold">Smt. Kamala & Sri Venkappa M. Agadi College of Engineering & Technology</h1>
                    <p className="text-xs sm:text-sm md:text-md">Lakshmeshwar-582116</p>
                    <p className="text-[10px] sm:text-xs text-gray-600">(Approved by AICTE, New Delhi & Affiliated to VTU Belagavi, ISO 9001:2015 Certified)</p>
                    <p className="text-[10px] sm:text-xs mt-1 sm:mt-2">Mobile: 9448120344 | Email: info@agadiengcollege.com | Website: www.agadiengcollege.com</p>
                </div>
                <div className="text-center">
                    <Image
                      src="https://i.postimg.cc/R0ZNbNsm/Untitled-design-4.png"
                      alt="Founder Chairman & Trustee"
                      width={80}
                      height={100}
                      className="mx-auto rounded-md border border-gray-300 w-16 h-20 sm:w-20 sm:h-24"
                      data-ai-hint="man portrait"
                    />
                    <p className="text-[10px] sm:text-xs font-semibold mt-1">Late Sri Venkappa M.Agadi</p>
                    <p className="text-[10px] sm:text-xs">Founder Chairman & Trustee</p>
                </div>
            </div>
        </header>
    );
}


export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
        <Header />
        <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8">
            <div className="w-full max-w-2xl text-center">
                <h1 className="font-headline text-4xl md:text-7xl font-black text-destructive drop-shadow-md">
                FindMySeat
                </h1>
                <p className="mt-4 text-base md:text-xl text-muted-foreground">
                Enter your University Seat Number (USN) to find your exam hall and seat number.
                </p>
                <StudentSearch />
            </div>
        </main>
        <footer className="w-full py-4 px-8 text-center border-t flex justify-center items-center gap-4">
            <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} SKSVMACET. All rights reserved.</p>
        </footer>
    </div>
  );
}
