
'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Class } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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


const classSchema = z.object({
  name: z.string().min(1, 'Class name is required'),
  location: z.string().min(1, 'Location is required'),
  benches: z.coerce.number().int().min(1, 'Number of benches must be at least 1'),
});

type ClassFormValues = z.infer<typeof classSchema>;

function ClassForm({ setOpen, existingClass }: { setOpen: (open: boolean) => void, existingClass?: Class }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: { 
        name: existingClass?.name || '', 
        location: existingClass?.location || '', 
        benches: existingClass?.benches || 1 
    },
  });

  const onSubmit = async (data: ClassFormValues) => {
    setLoading(true);
    try {
        if (existingClass?.id) {
            const classRef = doc(db, 'classes', existingClass.id);
            await updateDoc(classRef, data);
            toast({ title: 'Success', description: `Class "${data.name}" updated.` });
        } else {
            await addDoc(collection(db, 'classes'), data);
            toast({ title: 'Success', description: `Class "${data.name}" has been added.` });
        }
      
      form.reset();
      setOpen(false);
    } catch (error: any) {
      console.error('Error saving class: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to save class. Please try again.',
      });
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
              <FormLabel>Class Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., A" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="benches"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bench Count</FormLabel>
              <FormControl>
                <Input type="number" placeholder="e.g., 30" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="location"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Location</FormLabel>
              <FormControl>
                <Input placeholder="e.g., PUC Building" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingClass ? 'Update Class' : 'Add Class'}
        </Button>
      </form>
    </Form>
  );
}

export default function ClassesPage() {
  const { toast } = useToast();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);


  useEffect(() => {
    const q = collection(db, 'classes');
    const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const classesData: Class[] = [];
      querySnapshot.forEach((doc) => {
        classesData.push({ id: doc.id, ...doc.data() } as Class);
      });
      setClasses(classesData.sort((a, b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const handleAddClick = () => {
    setEditingClass(undefined);
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (cls: Class) => {
    setEditingClass(cls);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
      setIsDeleting(true);
      try {
        await deleteDoc(doc(db, 'classes', id));
        toast({ title: 'Success', description: 'Class deleted.' });
      } catch (error: any) {
          console.error("Error deleting class: ", error);
          toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete class.' });
      } finally {
          setIsDeleting(false);
      }
  };


  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Class Management</h1>
          <p className="text-muted-foreground">Add and view exam classes and their locations.</p>
        </div>
         <Button onClick={handleAddClick}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Class
        </Button>
      </div>
      
       <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{editingClass ? 'Edit Class' : 'Add New Class'}</DialogTitle>
              <DialogDescription>
                {editingClass ? 'Modify the details of the class.' : "Fill in the details for the new class. Click save when you're done."}
              </DialogDescription>
            </DialogHeader>
            <ClassForm setOpen={setIsDialogOpen} existingClass={editingClass} />
          </DialogContent>
        </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Existing Classes</CardTitle>
          <CardDescription>A list of all available classes for exams.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Benches</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      <Loader2 className="mx-auto h-6 w-6 animate-spin text-primary" />
                    </TableCell>
                  </TableRow>
                ) : classes.length > 0 ? (
                  classes.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.location}</TableCell>
                      <TableCell>{c.benches}</TableCell>
                      <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(c)}>
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
                                  This action cannot be undone. This will permanently delete the class.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(c.id!)} disabled={isDeleting}>
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
                  <TableRow>
                    <TableCell colSpan={4} className="text-center h-24">
                      No classes found. Add one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
