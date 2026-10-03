export type FileStatus = 'Available' | 'Issued' | 'Under Digitization' | 'Missing' | 'Archived';
export type StorageStatus = 'Active' | 'Maintenance' | 'Inactive' | 'Decommissioned';

export interface Shelf {
  id: string;
  code: string;
  name: string;
  capacity: number;
  occupied: number;
  position: number;
}

export interface StorageUnit {
  id: string;
  code: string;
  name: string;
  type: 'Almirah' | 'Rack' | 'Cabinet';
  status: StorageStatus;
  x: number;
  y: number;
  width: number;
  height: number;
  shelves: Shelf[];
}

export interface Room {
  id: string;
  code: string;
  name: string;
  building: string;
  floor: string;
  occupancy: number;
  capacity: number;
  status: 'Operational' | 'Restricted' | 'Maintenance';
  storageUnits: StorageUnit[];
}

export interface RecordFile {
  id: string;
  rfId: string;
  fileNumber: string;
  subject: string;
  department: string;
  year: number;
  status: FileStatus;
  location: string;
  roomId: string;
  almirah: string;
  shelf: string;
  position: number;
  codalLife: string;
  createdAt: string;
  lastMovement: string;
  holder?: string;
  description: string;
}

export interface TimelineEvent {
  id: string;
  label: string;
  date: string;
  actor: string;
  detail: string;
  tone: 'default' | 'success' | 'warning' | 'danger';
}
