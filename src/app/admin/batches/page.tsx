
'use client';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, QuerySnapshot, DocumentData, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Batch } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Loader2, Edit, Trash2 } from 'lucide-react';
import { generateUsnRange, parseUsnList } from '@/lib/batch-utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const batchSchema = z.object({
  name: z.string().min(1, 'Batch name is required'),
  addMethod: z.enum(['range', 'list']),
  startUsn: z.string().optional(),
  endUsn: z.string().optional(),
  studentsList: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.addMethod === 'range') {
        if (!data.startUsn) {
            ctx.addIssue({ code: 'custom', path: ['startUsn'], message: 'Start USN is required.' });
        }
        if (!data.endUsn) {
            ctx.addIssue({ code: 'custom', path: ['endUsn'], message: 'End USN is required.' });
        }
        if (data.startUsn && data.endUsn) {
            const startPrefix = data.startUsn.slice(0, -3);
            const endPrefix = data.endUsn.slice(0, -3);
            if (startPrefix.toUpperCase() !== endPrefix.toUpperCase()) {
                 ctx.addIssue({ code: 'custom', path: ['endUsn'], message: 'Start and End USN must have the same prefix.' });
            }
            const startNum = parseInt(data.startUsn.slice(-3), 10);
            const endNum = parseInt(data.endUsn.slice(-3), 10);
             if (isNaN(startNum) || isNaN(endNum) || startNum > endNum) {
                 ctx.addIssue({ code: 'custom', path: ['endUsn'], message: 'End USN must be greater than Start USN.' });
            }
        }
    } else if (data.addMethod === 'list') {
        if (!data.studentsList || data.studentsList.length < 10) {
            ctx.addIssue({ code: 'custom', path: ['studentsList'], message: 'At least one USN is required.' });
        }
    }
});

type BatchFormValues = z.infer<typeof batchSchema>;

function BatchForm({ setOpen, existingBatch }: { setOpen: (open: boolean) => void; existingBatch?: Batch }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const isEditing = !!existingBatch;

  const form = useForm<BatchFormValues>({
    resolver: zodResolver(batchSchema),
    defaultValues: existingBatch ? {
      name: existingBatch.name,
      addMethod: 'list', 
      studentsList: existingBatch.students.join('\n'),
    } : {
      name: '',
      addMethod: 'range',
      startUsn: '',
      endUsn: '',
      studentsList: '',
    },
  });

  const onSubmit = async (data: BatchFormValues) => {
    setLoading(true);
    try {
      let studentList: string[] = [];
      if (data.addMethod === 'range' && data.startUsn && data.endUsn && !isEditing) {
          const usnString = `${data.startUsn} to ${data.endUsn}`;
          studentList = generateUsnRange(usnString);
      } else if (data.addMethod === 'list' && data.studentsList) {
          studentList = parseUsnList(data.studentsList);
      }

      if (data.addMethod === 'list' && studentList.length === 0 && data.studentsList) {
          studentList = parseUsnList(data.studentsList);
      }

      const batchData = { name: data.name, students: studentList };
      
      if (existingBatch?.id) {
        const updatedStudents = parseUsnList(data.studentsList || '');
        const finalBatchData = { name: data.name, students: updatedStudents };
        const batchRef = doc(db, 'batches', existingBatch.id);
        await updateDoc(batchRef, finalBatchData);
        toast({ title: 'Success', description: `Batch "${data.name}" updated.` });
      } else {
        await addDoc(collection(db, 'batches'), batchData);
        toast({ title: 'Success', description: `Batch "${data.name}" added.` });
      }

      form.reset();
      setOpen(false);
    } catch (error: any) {
      console.error('Error saving batch: ', error);
      toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to save batch.' });
    } finally {
      setLoading(false);
    }
  };

  const addMethod = form.watch('addMethod');
  
  useEffect(() => {
    if (isEditing) {
        form.setValue('addMethod', 'list');
    }
  }, [isEditing, form]);


  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batch Name</FormLabel>
              <FormControl><Input placeholder="e.g., 22CS" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {!isEditing && (
            <FormField
            control={form.control}
            name="addMethod"
            render={({ field }) => (
                <FormItem className="space-y-3">
                <FormLabel>Student Add Method</FormLabel>
                <FormControl>
                    <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                    >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="range" /></FormControl>
                        <FormLabel className="font-normal">Enter Range</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl><RadioGroupItem value="list" /></FormControl>
                        <FormLabel className="font-normal">Enter List</FormLabel>
                    </FormItem>
                    </RadioGroup>
                </FormControl>
                </FormItem>
            )}
            />
        )}
        
        {addMethod === 'range' && !isEditing && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField control={form.control} name="startUsn" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Start USN</FormLabel>
                        <FormControl><Input placeholder="e.g., 2KA23CS001" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="endUsn" render={({ field }) => (
                    <FormItem>
                        <FormLabel>End USN</FormLabel>
                        <FormControl><Input placeholder="e.g., 2KA23CS069" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
        )}

        {(addMethod === 'list' || isEditing) && (
             <FormField
                control={form.control}
                name="studentsList"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Student USNs</FormLabel>
                    <FormControl>
                        <Textarea
                        placeholder="Enter USNs one per line."
                        className="min-h-[200px]"
                        {...field}
                        />
                    </FormControl>
                    {isEditing && <FormDescription>You are editing the student list directly.</FormDescription>}
                    <FormMessage />
                    </FormItem>
                )}
            />
        )}
       
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingBatch ? 'Update Batch' : 'Add Batch'}
        </Button>
      </form>
    </Form>
  );
}

export default function BatchesPage() {
  const { toast } = useToast();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | undefined>(undefined);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const q = collection(db, 'batches');
    const unsubscribe = onSnapshot(q, (querySnapshot: QuerySnapshot<DocumentData>) => {
      const batchesData: Batch[] = [];
      querySnapshot.forEach((doc) => {
        batchesData.push({ id: doc.id, ...doc.data() } as Batch);
      });
      setBatches(batchesData.sort((a,b) => a.name.localeCompare(b.name)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleAddClick = () => {
    setEditingBatch(undefined);
    setIsDialogOpen(true);
  };
  
  const handleEditClick = (batch: Batch) => {
    setEditingBatch(batch);
    setIsDialogOpen(true);
  };
  
  const handleDelete = async (id: string) => {
      setIsDeleting(true);
      try {
        await deleteDoc(doc(db, 'batches', id));
        toast({ title: 'Success', description: 'Batch deleted.' });
      } catch (error: any) {
          console.error("Error deleting batch: ", error);
          toast({ variant: 'destructive', title: 'Error', description: error.message || 'Failed to delete batch.' });
      } finally {
          setIsDeleting(false);
      }
  };

  const groupedBatches = batches.reduce((acc, batch) => {
    const yearPrefix = batch.name.match(/^\d{2}/);
    const groupName = yearPrefix ? `${yearPrefix[0]} Batches` : 'Other Batches';
    
    if (!acc[groupName]) {
      acc[groupName] = [];
    }
    acc[groupName].push(batch);
    
    return acc;
  }, {} as Record<string, Batch[]>);

  const sortedGroupNames = Object.keys(groupedBatches).sort((a, b) => {
    if (a === 'Other Batches') return 1;
    if (b === 'Other Batches') return -1;
    return b.localeCompare(a); 
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Batch Management</h1>
          <p className="text-muted-foreground">Add and manage student batches.</p>
        </div>
        <Button onClick={handleAddClick}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Batch
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingBatch ? 'Edit Batch' : 'Add New Batch'}</DialogTitle>
            <DialogDescription>
             {editingBatch ? 'Modify the details of the batch.' : 'Fill in the details for the new batch.'}
            </DialogDescription>
          </DialogHeader>
          <BatchForm setOpen={setIsDialogOpen} existingBatch={editingBatch} />
        </DialogContent>
      </Dialog>
      
      <div className="space-y-4">
        {loading ? (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : sortedGroupNames.length > 0 ? (
            <Accordion type="multiple" defaultValue={sortedGroupNames} className="w-full">
                {sortedGroupNames.map(groupName => (
                    <AccordionItem value={groupName} key={groupName} className="border-b-0">
                        <AccordionTrigger className="text-xl font-headline py-3 hover:no-underline mb-2 -mt-2">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-8 bg-primary rounded-full"></div>
                            {groupName}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                            <Card className="border-l-4 border-primary">
                                <CardContent className="p-0">
                                    <div className="w-full overflow-x-auto">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                <TableHead>Batch Name</TableHead>
                                                <TableHead>Student Count</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                            {groupedBatches[groupName].map((batch) => (
                                                <TableRow key={batch.id}>
                                                <TableCell className="font-medium">{batch.name}</TableCell>
                                                <TableCell>{batch.students.length}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(batch)}>
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
                                                            This action cannot be undone. This will permanently delete the batch.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDelete(batch.id!)} disabled={isDeleting}>
                                                                {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                                </TableRow>
                                            ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </CardContent>
                            </Card>
                        </AccordionContent>
                    </AccordionItem>
                ))}
            </Accordion>
        ) : (
             <Card>
                <CardContent>
                    <div className="text-center h-24 flex items-center justify-center">No batches found. Add one to get started.</div>
                </CardContent>
             </Card>
        )}
      </div>
    </div>
  );
}
