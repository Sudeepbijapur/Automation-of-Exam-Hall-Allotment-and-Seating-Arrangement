
'use client';
import { useState, useEffect } from 'react';
import { collection, addDoc, onSnapshot, doc, updateDoc, QuerySnapshot, DocumentData, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Invigilator } from '@/lib/types';
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
import { PlusCircle, Loader2, Edit, Trash2, UserCog } from 'lucide-react';
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

const invigilatorSchema = z.object({
  name: z.string().min(3, 'Invigilator name must be at least 3 characters long'),
});

type InvigilatorFormValues = z.infer<typeof invigilatorSchema>;

function InvigilatorForm({ setOpen, existingInvigilator }: { setOpen: (open: boolean) => void; existingInvigilator?: Invigilator }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<InvigilatorFormValues>({
    resolver: zodResolver(invigilatorSchema),
    defaultValues: {
      name: existingInvigilator?.name || '',
    },
  });

  const onSubmit = async (data: InvigilatorFormValues) => {
    setLoading(true);
    try {
      if (existingInvigilator?.id) {
        const invigilatorRef = doc(db, 'invigilators', existingInvigilator.id);
        await updateDoc(invigilatorRef, data);
        toast({ title: 'Success', description: 'Invigilator updated.' });
      } else {
        await addDoc(collection(db, 'invigilators'), data);
        toast({ title: 'Success', description: 'Invigilator added.' });
      }
      form.reset();
      setOpen(false);
    } catch (error) {
      console.error('Error saving invigilator: ', error);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to save invigilator.' });
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
              <FormLabel>Invigilator Name</FormLabel>
              <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingInvigilator ? 'Update Invigilator' : 'Add Invigilator'}
        </Button>
      </form>
    </Form>
  );
}

export default function InvigilatorsPage() {
  const { toast } = useToast();
  const [invigilators, setInvigilators] = useState<Invigilator[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInvigilator, setEditingInvigilator] = useState<Invigilator | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = collection(db, 'invigilators');
    const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const invigilatorsData: Invigilator[] = [];
      querySnapshot.forEach((doc) => {
        invigilatorsData.push({ id: doc.id, ...doc.data() } as Invigilator);
      });
      setInvigilators(invigilatorsData.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddClick = () => {
    setEditingInvigilator(undefined);
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (invigilator: Invigilator) => {
    setEditingInvigilator(invigilator);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
      setIsDeleting(true);
      try {
          await deleteDoc(doc(db, 'invigilators', id));
          toast({ title: 'Success', description: 'Invigilator deleted.' });
      } catch (error) {
          console.error("Error deleting invigilator: ", error);
          toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete invigilator.' });
      } finally {
          setIsDeleting(false);
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Invigilator Management</h1>
          <p className="text-muted-foreground">Add, edit, and remove invigilators.</p>
        </div>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Invigilator
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingInvigilator ? 'Edit Invigilator' : 'Add New Invigilator'}</DialogTitle>
            <DialogDescription>
             {editingInvigilator ? 'Modify the details of the invigilator.' : 'Enter the name of the new invigilator.'}
            </DialogDescription>
          </DialogHeader>
          <InvigilatorForm setOpen={setIsDialogOpen} existingInvigilator={editingInvigilator} />
        </DialogContent>
      </Dialog>
      
      <Card>
        <CardHeader>
          <CardTitle>Available Invigilators</CardTitle>
          <CardDescription>A list of all invigilators available for exam duty.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead><div className="flex items-center gap-2"><UserCog className="h-4 w-4" /> Name</div></TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={2} className="text-center h-24"><Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" /></TableCell></TableRow>
                ) : invigilators.length > 0 ? (
                  invigilators.map((invigilator) => (
                    <TableRow key={invigilator.id}>
                      <TableCell className="font-medium">{invigilator.name}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEditClick(invigilator)}>
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
                                  This action cannot be undone. This will permanently delete the invigilator.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(invigilator.id!)} disabled={isDeleting}>
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
                  <TableRow><TableCell colSpan={2} className="text-center h-24">No invigilators found. Add one to get started.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
