
'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Exam, SeatAllocation, Class } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Download, UserCog, MapPin, Calendar, Clock, Book } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import React from 'react';
import { useParams } from 'next/navigation';

const html2pdf = () => import('html2pdf.js').then(m => m.default);

interface PairedSeat {
  benchNo: number;
  student1?: { usn: string; subject: string; };
  student2?: { usn: string; subject: string; };
}

interface ClassReport {
  className: string;
  invigilator: string;
  location: string;
  pairedSeats: PairedSeat[];
}

export default function ExamReportPage() {
  const params = useParams();
  const examId = params.examId as string;
  const [exam, setExam] = useState<Exam | null>(null);
  const [classReports, setClassReports] = useState<ClassReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchReportData = async () => {
      if (!examId) return;

      try {
        setLoading(true);
        const examDocRef = doc(db, 'exams', examId);
        const examSnap = await getDoc(examDocRef);

        if (!examSnap.exists()) {
          setError('Exam not found.');
          return;
        }
        const examData = { id: examSnap.id, ...examSnap.data() } as Exam;
        setExam(examData);

        const allocationsQuery = query(
          collection(db, 'seat_allocations'),
          where('examId', '==', examId)
        );
        const allocationsSnap = await getDocs(allocationsQuery);
        const allocationsData = allocationsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SeatAllocation));
        
        const allocationsByClass = allocationsData.reduce((acc, alloc) => {
          if (!acc[alloc.class]) {
            acc[alloc.class] = [];
          }
          acc[alloc.class].push(alloc);
          return acc;
        }, {} as Record<string, SeatAllocation[]>);
        
        const reports: ClassReport[] = Object.entries(allocationsByClass).map(([className, allocations]) => {
          const firstAlloc = allocations[0];
          const classData = {
              className: className,
              invigilator: firstAlloc.invigilator || 'N/A',
              location: firstAlloc.location,
              pairedSeats: [],
          };
          
          const seatsByBench = allocations.reduce((acc, alloc) => {
              if (!acc[alloc.benchNo]) {
                  acc[alloc.benchNo] = [];
              }
              acc[alloc.benchNo].push(alloc);
              return acc;
          }, {} as Record<number, SeatAllocation[]>);

          classData.pairedSeats = Object.entries(seatsByBench).map(([benchNo, students]) => {
              const paired: PairedSeat = { benchNo: parseInt(benchNo) };
              if (students[0]) {
                  paired.student1 = { usn: students[0].id!, subject: students[0].subject };
              }
              if (students[1]) {
                  paired.student2 = { usn: students[1].id!, subject: students[1].subject };
              }
              return paired;
          }).sort((a,b) => a.benchNo - b.benchNo);

          return classData;
        }).sort((a,b) => a.className.localeCompare(b.className));
        
        setClassReports(reports);

      } catch (err: any) {
        console.error("Error fetching report data:", err);
        setError(`Failed to load report data. ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchReportData();
  }, [examId]);

  const handleDownloadPdf = async () => {
    const reportElement = document.getElementById('report-section');
    if (!reportElement) return;

    try {
        const generator = await html2pdf();
        const examDate = exam ? format(new Date(exam.date), 'yyyy-MM-dd') : 'report';
        const filename = `exam-seating-report-${examDate}.pdf`;
        
        generator().from(reportElement).set({
            margin: [0.5, 0.5, 0.5, 0.5],
            filename: filename,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'landscape' }
        }).save();
    } catch(e) {
        console.error("PDF generation failed:", e)
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <Button asChild variant="outline" className="mb-4">
            <Link href="/admin/exams">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Exams
            </Link>
          </Button>
          <h1 className="text-3xl font-bold font-headline">Exam Seating Report</h1>
          {exam && (
            <p className="text-muted-foreground">
              Report for exam on {format(new Date(`${exam.date}T${exam.time}`), 'PPP, p')}
            </p>
          )}
        </div>
        <Button onClick={handleDownloadPdf}>
          <Download className="mr-2 h-4 w-4" />
          Download PDF
        </Button>
      </div>
      
      <div id="report-section" className="space-y-8">
        {classReports.map((report) => (
            <Card key={report.className}>
                <CardHeader>
                    <div className="text-sm text-muted-foreground flex flex-wrap gap-x-4 gap-y-2 items-center">
                        <div className="flex items-center gap-2 font-semibold text-primary"><UserCog className="h-4 w-4" />Invigilator: {report.invigilator}</div>
                        <div className="flex items-center gap-2"><MapPin className="h-4 w-4" />Block: {report.className} ({report.location})</div>
                        {exam && (
                           <>
                            <div className="flex items-center gap-2"><Calendar className="h-4 w-4" />Date: {format(new Date(exam.date), 'dd-MMM-yyyy')}</div>
                            <div className="flex items-center gap-2"><Clock className="h-4 w-4" />Time: {format(new Date(`1970-01-01T${exam.time}`), 'p')}</div>
                           </>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="w-full overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Sl. No</TableHead>
                                    <TableHead className="w-[100px]">Block</TableHead>
                                    <TableHead className="w-[100px]">Bench No</TableHead>
                                    <TableHead>Student 1 (USN)</TableHead>
                                    <TableHead>Sub Code</TableHead>
                                    <TableHead>Student 2 (USN)</TableHead>
                                    <TableHead>Sub Code</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                            {report.pairedSeats.map((seat, index) => (
                                <TableRow key={seat.benchNo}>
                                    <TableCell>{index + 1}</TableCell>
                                    <TableCell>{report.className}</TableCell>
                                    <TableCell>{seat.benchNo}</TableCell>
                                    <TableCell>{seat.student1?.usn}</TableCell>
                                    <TableCell>{seat.student1?.subject}</TableCell>
                                    <TableCell>{seat.student2?.usn || '-'}</TableCell>
                                    <TableCell>{seat.student2?.subject || '-'}</TableCell>
                                </TableRow>
                            ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        ))}
        {classReports.length === 0 && !loading && (
            <Card>
                <CardContent>
                    <p className="py-12 text-center text-muted-foreground">No seating allocations found for this exam.</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
