export interface Extinguisher {
  id: number;
  serialNumber: string;
  location: string;
  type: 'WATER' | 'CO2' | 'FOAM' | 'DRY_CHEMICAL';
  size: '2.5LBS' | '5LBS' | '9LBS' | '12LBS';
  installationDate: string;
  expiryDate: string;
  status: 'OPERATIONAL' | 'EXPIRED' | 'DECOMMISSIONED';
}

export interface InspectorInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
}

export interface Inspection {
  id: number;
  userId: number;
  extinguisherId: number;
  inspectorId: number | null;
  inspectionDate: string;
  inspectionTime: string;
  status: 'SCHEDULED' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  user?: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  inspector?: InspectorInfo;
  extinguisher?: {
    id: number;
    serialNumber: string;
    location: string;
    type: string;
    size: string;
  };
}

export interface Maintenance {
  id: number;
  inspectionId: number;
  inspectorId: number;
  actions: string;
  maintenanceDate: string;
  conditionsNoted: string;
  inspector?: InspectorInfo;
  inspection?: {
    id: number;
    inspectionDate: string;
    status: string;
    extinguisherId: number;
    serialNumber: string;
  };
}

export interface Notification {
  id: number;
  userId: number;
  message: string;
  createdAt: string;
  isRead: boolean;
}

export const mockExtinguishers: Extinguisher[] = [
  {
    id: 1,
    serialNumber: 'EXT-001',
    location: 'Main Hall A',
    type: 'CO2',
    size: '5LBS',
    installationDate: '2023-01-15',
    expiryDate: '2025-01-15',
    status: 'EXPIRED',
  },
  {
    id: 2,
    serialNumber: 'EXT-002',
    location: 'Kitchen Area',
    type: 'DRY_CHEMICAL',
    size: '12LBS',
    installationDate: '2023-06-20',
    expiryDate: '2025-06-20',
    status: 'OPERATIONAL', // Expiry date in past to test auto-expiry logic
  },
  {
    id: 3,
    serialNumber: 'EXT-003',
    location: 'Server Room',
    type: 'CO2',
    size: '9LBS',
    installationDate: '2025-10-10',
    expiryDate: '2028-10-10',
    status: 'OPERATIONAL',
  },
  {
    id: 4,
    serialNumber: 'EXT-004',
    location: 'Warehouse B',
    type: 'FOAM',
    size: '12LBS',
    installationDate: '2024-02-12',
    expiryDate: '2027-02-12',
    status: 'OPERATIONAL',
  },
  {
    id: 5,
    serialNumber: 'EXT-005',
    location: 'Office C',
    type: 'WATER',
    size: '2.5LBS',
    installationDate: '2025-03-01',
    expiryDate: '2028-03-01',
    status: 'OPERATIONAL', // Edge: no inspections
  },
];

export const mockInspections: Inspection[] = [
  {
    id: 1,
    userId: 4,
    extinguisherId: 2,
    inspectorId: 2,
    inspectionDate: '2026-07-15',
    inspectionTime: '10:00:00',
    status: 'SCHEDULED',
    user: { id: 4, firstName: 'Regular', lastName: 'One', email: 'user1@tzw.rw' },
    inspector: { id: 2, firstName: 'Inspector', lastName: 'One', email: 'inspector1@tzw.rw' },
    extinguisher: { id: 2, serialNumber: 'EXT-002', location: 'Kitchen Area', type: 'DRY_CHEMICAL', size: '12LBS' },
  },
  {
    id: 2,
    userId: 5,
    extinguisherId: 3,
    inspectorId: 3,
    inspectionDate: '2026-05-10',
    inspectionTime: '14:30:00',
    status: 'COMPLETED',
    user: { id: 5, firstName: 'Regular', lastName: 'Two', email: 'user2@tzw.rw' },
    inspector: { id: 3, firstName: 'Inspector', lastName: 'Two', email: 'inspector2@tzw.rw' },
    extinguisher: { id: 3, serialNumber: 'EXT-003', location: 'Server Room', type: 'CO2', size: '9LBS' },
  },
  {
    id: 3,
    userId: 4,
    extinguisherId: 4,
    inspectorId: 2,
    inspectionDate: '2026-04-01',
    inspectionTime: '09:00:00',
    status: 'CANCELLED',
    user: { id: 4, firstName: 'Regular', lastName: 'One', email: 'user1@tzw.rw' },
    inspector: { id: 2, firstName: 'Inspector', lastName: 'One', email: 'inspector1@tzw.rw' },
    extinguisher: { id: 4, serialNumber: 'EXT-004', location: 'Warehouse B', type: 'FOAM', size: '12LBS' },
  },
];

export const mockMaintenance: Maintenance[] = [
  {
    id: 1,
    inspectionId: 2,
    inspectorId: 3,
    actions: 'Recharged CO2 cylinder, replaced nozzle safety seal.',
    maintenanceDate: '2026-05-10',
    conditionsNoted: 'Extinguisher pressure was slightly low.',
    inspector: { id: 3, firstName: 'Inspector', lastName: 'Two', email: 'inspector2@tzw.rw' },
    inspection: { id: 2, inspectionDate: '2026-05-10', status: 'COMPLETED', extinguisherId: 3, serialNumber: 'EXT-003' },
  },
  {
    id: 2,
    inspectionId: 2,
    inspectorId: 2,
    actions: 'Cleaned external body and bracket assembly.',
    maintenanceDate: '2026-05-15',
    conditionsNoted: 'Dust accumulation on body.',
    inspector: { id: 2, firstName: 'Inspector', lastName: 'One', email: 'inspector1@tzw.rw' },
    inspection: { id: 2, inspectionDate: '2026-05-10', status: 'COMPLETED', extinguisherId: 3, serialNumber: 'EXT-003' },
  },
];

export const mockNotifications: Notification[] = [
  {
    id: 1,
    userId: 4,
    message: 'Dear Regular, an inspection for extinguisher EXT-002 at Kitchen Area has been scheduled.',
    createdAt: '2026-06-03T10:12:00.000Z',
    isRead: false,
  },
  {
    id: 2,
    userId: 4,
    message: 'An expired extinguisher EXT-001 was found in Main Hall A.',
    createdAt: '2026-06-02T09:12:00.000Z',
    isRead: true,
  },
  {
    id: 3,
    userId: 4,
    message: 'Maintenance logged for EXT-003.',
    createdAt: '2026-06-03T08:12:00.000Z',
    isRead: true,
  },
];
