
import { Timestamp } from 'firebase/firestore';

export interface Class {
  id?: string;
  name: string;
  location: string;
  benches: number;
}

export interface Batch {
  id?: string;
  name: string;
  students: string[];
}

export interface Elective {
  id?: string;
  name: string;
  code: string;
  students: string[];
}

export interface Invigilator {
    id?: string;
    name: string;
}

export interface Exam {
  id?: string;
  examType: 'core' | 'elective';
  date: string;
  time: string;
  classes: string[];
  invigilators: string[];
  batches: string[];
  electives: string[];
  subjects: Record<string, unknown>;
  examTimestamp: Timestamp;
  createdAt?: Timestamp;
}


export interface SeatAllocation {
  id: string; 
  examId: string;
  class: string;
  location: string;
  benchNo: number;
  subject: string;
  batch: string; 
  invigilator?: string;
  examTimestamp: Timestamp;
}
