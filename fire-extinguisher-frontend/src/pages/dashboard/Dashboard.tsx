import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Flame, ShieldCheck, AlertTriangle, Calendar, ClipboardCheck } from 'lucide-react';
import StatusBadge from '../../components/StatusBadge';
import { mockExtinguishers, mockInspections } from '../../mock/mockData';

export default function Dashboard() {
  const currentDate = new Date('2026-06-03T11:12:13+02:00'); // Use current system date

  // Dynamically calculate stats based on mock data and expiry dates
  const totalExtinguishers = mockExtinguishers.length;
  
  const expiredExtinguishers = mockExtinguishers.filter(
    (e) => e.status === 'EXPIRED' || new Date(e.expiryDate) < currentDate
  ).length;

  const operationalExtinguishers = mockExtinguishers.filter(
    (e) => e.status === 'OPERATIONAL' && new Date(e.expiryDate) >= currentDate
  ).length;

  const scheduledInspections = mockInspections.filter(
    (i) => i.status === 'SCHEDULED'
  ).length;

  // Get recent 5 inspections
  const recentInspections = [...mockInspections]
    .sort((a, b) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime())
    .slice(0, 5);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Page Title Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time status overview of TZW LTD fire protection assets.
          </p>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Extinguishers */}
        <Card className="p-4 space-y-1 bg-card border-border shadow-sm rounded-md transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground font-medium">Total Extinguishers</p>
            <div className="p-2 bg-primary/10 rounded-full">
              <Flame className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalExtinguishers}</p>
        </Card>

        {/* Operational Extinguishers */}
        <Card className="p-4 space-y-1 bg-card border-border shadow-sm rounded-md transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground font-medium">Operational Assets</p>
            <div className="p-2 bg-green-500/10 dark:bg-green-500/20 rounded-full">
              <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{operationalExtinguishers}</p>
        </Card>

        {/* Expired Extinguishers */}
        <Card className="p-4 space-y-1 bg-card border-border shadow-sm rounded-md transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground font-medium">Expired Assets</p>
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground text-destructive">{expiredExtinguishers}</p>
        </Card>

        {/* Scheduled Inspections */}
        <Card className="p-4 space-y-1 bg-card border-border shadow-sm rounded-md transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground font-medium">Scheduled Inspections</p>
            <div className="p-2 bg-blue-500/10 dark:bg-blue-500/20 rounded-full">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{scheduledInspections}</p>
        </Card>
      </div>

      {/* Recent Inspections Table */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-medium text-foreground">Recent Inspections</h2>
        </div>
        <Card className="p-0 overflow-hidden border-border bg-card shadow-sm rounded-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Serial No</TableHead>
                  <TableHead className="font-semibold text-foreground">Location</TableHead>
                  <TableHead className="font-semibold text-foreground">Inspection Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Time</TableHead>
                  <TableHead className="font-semibold text-foreground">Inspector</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentInspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  recentInspections.map((inspection) => (
                    <TableRow key={inspection.id} className="border-b border-border hover:bg-muted/20">
                      <TableCell className="font-medium text-foreground">
                        {inspection.extinguisher?.serialNumber || 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inspection.extinguisher?.location || 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inspection.inspectionDate}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inspection.inspectionTime}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {inspection.inspector
                          ? `${inspection.inspector.firstName} ${inspection.inspector.lastName}`
                          : 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={inspection.status} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
}
