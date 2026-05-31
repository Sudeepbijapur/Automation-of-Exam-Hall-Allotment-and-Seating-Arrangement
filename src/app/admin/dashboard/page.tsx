
'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { School, Users, ClipboardList, Loader2, ArrowLeft, BookMarked, UserCheck, UserCog } from 'lucide-react';
import { useAuth } from '@/components/auth/auth-provider';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Stats {
  classes: number;
  batches: number;
  electives: number;
  students: number;
  exams: number;
  invigilators: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const examsQuery = query(collection(db, 'exams'), where('examTimestamp', '!=', null));

        const [classesSnap, batchesSnap, electivesSnap, examsSnap, invigilatorsSnap] = await Promise.all([
            getDocs(collection(db, 'classes')),
            getDocs(collection(db, 'batches')),
            getDocs(collection(db, 'electives')),
            getDocs(examsQuery),
            getDocs(collection(db, 'invigilators')),
        ]);

        const coreStudents = batchesSnap.docs.reduce((acc, doc) => acc + (doc.data().students?.length || 0), 0);
        const electiveStudents = electivesSnap.docs.reduce((acc, doc) => acc + (doc.data().students?.length || 0), 0);
        
        const studentSet = new Set<string>();
        batchesSnap.docs.forEach(doc => doc.data().students.forEach((s: string) => studentSet.add(s)));
        electivesSnap.docs.forEach(doc => doc.data().students.forEach((s: string) => studentSet.add(s)));

        setStats({
          classes: classesSnap.size,
          batches: batchesSnap.size,
          electives: electivesSnap.size,
          students: studentSet.size,
          exams: examsSnap.size,
          invigilators: invigilatorsSnap.size,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email?.split('@')[0]}! Here's an overview.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Student Page
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <School className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.classes ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Core Batches</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.batches ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Elective Subjects</CardTitle>
              <BookMarked className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.electives ?? 0}</div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Invigilators</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.invigilators ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.students ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Scheduled Exams</CardTitle>
              <ClipboardList className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.exams ?? 0}</div>
            </CardContent>
          </Card>
        </div>
      )}
       <Card className="mt-6">
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-muted-foreground">
            Manage your exam seating allocation process here. You can add classes, define student batches (for core subjects) and elective subjects, then schedule exams for either type. When you publish an exam, the system will automatically allocate seats based on the defined rules.
            </p>
        </CardContent>
       </Card>
    </div>
  );
}
