
'use client';

import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SeatAllocation } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Building, Loader2, LocateFixed, Book, School, Search, Clock, Info } from 'lucide-react';
import { useRouter } from 'next/navigation';

const searchSchema = z.object({
  usn: z.string().trim().min(1, 'USN is required.'),
});

type SearchFormValues = z.infer<typeof searchSchema>;

interface SeatAllocationWithDate extends SeatAllocation {
    examDate: Date;
}

export default function StudentSearch() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SeatAllocationWithDate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [alertType, setAlertType] = useState<'destructive' | 'info'>('destructive');

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: { usn: '' },
  });

  const onSubmit = async (data: SearchFormValues) => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    const formattedInput = data.usn.trim();

    try {
        const secretDocRef = doc(db, 'secrets', 'adminLogin');
        const secretSnap = await getDoc(secretDocRef);

        if (secretSnap.exists()) {
            const storedCode = secretSnap.data().code;
            if (formattedInput.toLowerCase() === storedCode.toLowerCase()) {
                router.push('/login');
                setLoading(false);
                return;
            }
        }

        const allocationDocRef = doc(db, 'seat_allocations', formattedInput.toUpperCase());
        const allocationSnap = await getDoc(allocationDocRef);

        if (allocationSnap.exists()) {
            const allocationData = allocationSnap.data() as SeatAllocation;
            
            if (allocationData.examTimestamp && allocationData.examTimestamp instanceof Timestamp) {
                const examDate = allocationData.examTimestamp.toDate();
                const now = new Date();
                const tenMinutesBeforeExam = new Date(examDate.getTime() - 10 * 60 * 1000);
                const fifteenMinutesAfterExam = new Date(examDate.getTime() + 15 * 60 * 1000);

                if (now < tenMinutesBeforeExam) {
                    setAlertType('info');
                    setError(`Your seat will be available 10 minutes before the exam. Please check back after ${tenMinutesBeforeExam.toLocaleTimeString()}.`);
                } else if (now > fifteenMinutesAfterExam) {
                    setAlertType('info');
                    setError(`The seating information for this exam is no longer available as the exam has concluded.`);
                } else {
                    setResult({ ...allocationData, examDate });
                }
            } else {
                
                setResult({ ...allocationData, examDate: new Date() });
            }

        } else {
            setAlertType('destructive');
            setError('No exam allocation found for this USN. Please check and try again.');
        }
    } catch (err: any) {
        console.error("Error during search:", err);
        setAlertType('destructive');
        setError('An unexpected error occurred. Please try again later.');
    } finally {
        setLoading(false);
    }
  };
  
  const getAlertIcon = () => {
    switch (alertType) {
        case 'info':
            return <Clock className="h-4 w-4" />;
        default:
            return <Info className="h-4 w-4" />;
    }
  }
  
  const getAlertTitle = () => {
     switch (alertType) {
        case 'info':
            return "Please Wait";
        default:
            return "Error";
    }
  }


  return (
    <div className="mt-8 w-full">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
          <FormField
            control={form.control}
            name="usn"
            render={({ field }) => (
              <FormItem className="flex-grow">
                <FormControl>
                  <Input placeholder="Enter your complete USN" {...field} className="h-14 text-lg border-primary/50 rounded-full" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" size="lg" className="h-14 rounded-full" disabled={loading}>
            {loading ? <Loader2 className="animate-spin" /> : <Search />}
            <span className="ml-2 hidden md:inline">Search</span>
          </Button>
        </form>
      </Form>
      
      <div className="mt-8">
        {error && (
          <Alert variant={alertType === 'info' ? "info" : "destructive"}>
            {getAlertIcon()}
            <AlertTitle>{getAlertTitle()}</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {result && (
          <Card className="shadow-lg animate-in fade-in-50">
            <CardHeader>
              <CardTitle className="text-2xl font-headline text-center text-primary">Your Seating Information</CardTitle>
               <CardDescription className="text-center italic text-muted-foreground pt-2">
                "All the best for your exam!"
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
              <div className="flex flex-col items-center p-4 rounded-lg bg-background">
                <LocateFixed className="w-12 h-12 text-accent mb-2" />
                <p className="text-sm text-muted-foreground">Bench No.</p>
                <p className="text-2xl font-bold">{result.benchNo}</p>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-background">
                <School className="w-12 h-12 text-accent mb-2" />
                <p className="text-sm text-muted-foreground">Class</p>
                <p className="text-2xl font-bold">{result.class}</p>
              </div>
              <div className="flex flex-col items-center p-4 rounded-lg bg-background">
                <Building className="w-12 h-12 text-accent mb-2" />
                <p className="text-sm text-muted-foreground">Block Location</p>
                <p className="text-2xl font-bold">{result.location}</p>
              </div>
               <div className="flex flex-col items-center p-4 rounded-lg bg-background">
                <Book className="w-12 h-12 text-accent mb-2" />
                <p className="text-sm text-muted-foreground">Subject</p>
                <p className="text-2xl font-bold">{result.subject}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
