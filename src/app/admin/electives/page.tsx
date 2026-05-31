
'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Elective } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2, Edit, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { parseUsnList } from '@/lib/batch-utils';


const electiveSchema = z.object({
  name: z.string().min(1, 'Elective name is required'),
  code: z.string().min(1, 'Subject code is required'),
  students: z.string().min(10, 'At least one USN is required'),
});

type ElectiveFormValues = z.infer<typeof electiveSchema>;

function ElectiveForm({ setOpen, existingElective }: { setOpen: (open: boolean) => void; existingElective?: Elective }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<ElectiveFormValues>({
    resolver: zodResolver(electiveSchema),
    defaultValues: {
      name: existingElective?.name || '',
      code: existingElective?.code || '',
      students: existingElective?.students.join('\n') || '',
    },
  });

  const onSubmit = async (data: ElectiveFormValues) => {
    setLoading(true);
    try {
      const studentList = parseUsnList(data.students);
      const electiveData = { name: data.name, code: data.code, students: studentList };
      
      if (existingElective?.id) {
        const electiveRef = doc(db, 'electives', existingElective.id);
        await updateDoc(electiveRef, electiveData);
        toast({ title: 'Success', description: `Elective "${data.name}" updated.` });
      } else {
        await addDoc(collection(db, 'electives'), electiveData);
        toast({ title: 'Success', description: `Elective "${data.name}" added.` });
      }

      form.reset();
      setOpen(false);
    } catch (error: any) {
      console.error('Error saving elective: ', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save elective.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Elective Name</FormLabel>
              <FormControl><Input placeholder="e.g., Mechatronics" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject Code</FormLabel>
              <FormControl><Input placeholder="e.g., 18ME751" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="students"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Student USNs</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter one student USN per line."
                  className="min-h-[200px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingElective ? 'Update Elective' : 'Add Elective'}
        </Button>
      </form>
    </Form>
  );
}

export default function ElectivesPage() {
  const [electives, setElectives] = useState<Elective[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingElective, setEditingElective] = useState<Elective | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = collection(db, 'electives');
    const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const electivesData: Elective[] = [];
      querySnapshot.forEach((doc) => {
        electivesData.push({ id: doc.id, ...doc.data() } as Elective);
      });
      setElectives(electivesData.sort((a,b) => a.name.localeCompare(b.name)));
      setLoading(false);
    }, (error) => {
        console.error("Snapshot error:", error);
        toast({variant: 'destructive', title: 'Error', description: 'Failed to listen for elective updates.'})
        setLoading(false);
    });
    return () => unsubscribe();
  }, [toast]);

  const handleAddClick = () => {
    setEditingElective(undefined);
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (elective: Elective) => {
    setEditingElective(elective);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
      setIsDeleting(true);
      try {
          await deleteDoc(doc(db, 'electives', id));
          toast({ title: 'Success', description: 'Elective deleted.' });
      } catch (error: any) {
          console.error("Error deleting elective: ", error);
          toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete elective.' });
      } finally {
          setIsDeleting(false);
      }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Elective Management</h1>
          <p className="text-muted-foreground">Add and manage elective subjects and their student lists.</p>
        </div>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Elective
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingElective ? 'Edit Elective' : 'Add New Elective'}</DialogTitle>
            <DialogDescription>
             {editingElective ? 'Modify the details of the elective.' : 'Fill in the details for the new elective subject.'}
            </DialogDescription>
          </DialogHeader>
          <ElectiveForm setOpen={setIsDialogOpen} existingElective={editingElective} />
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>Existing Electives</CardTitle>
          <CardDescription>A list of all available elective subjects.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Elective Name</TableHead>
                  <TableHead>Subject Code</TableHead>
                  <TableHead>Student Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></TableCell></TableRow>
                ) : electives.length > 0 ? (
                  electives.map((elective) => (
                    <TableRow key={elective.id}>
                      <TableCell className="font-medium">{elective.name}</TableCell>
                      <TableCell>{elective.code}</TableCell>
                      <TableCell>{elective.students.length}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(elective)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                         <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="icon" disabled={isDeleting}>
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                  <span className="sr-only">Delete</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                  This action cannot be undone. This will permanently delete the elective subject.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(elective.id!)} disabled={isDeleting}>
                                      {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                      Delete
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="text-center h-24">No electives found. Add one to get started.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
