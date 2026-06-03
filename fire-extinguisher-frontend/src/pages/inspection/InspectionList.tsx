import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { inspectionApi } from '../../api/inspection';
import type { Inspection } from '../../mock/mockData';
import { mockInspections } from '../../mock/mockData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Plus, Eye, CheckSquare, Wrench, Calendar, MapPin, User, Clock, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '../../components/StatusBadge';
import PaginationControls from '../../components/PaginationControls';
import InspectionForm from './InspectionForm';

const ITEMS_PER_PAGE = 10;
const USE_REAL_API = true;

const statusOptions = ['SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED'];

export default function InspectionList() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog / Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [preselectedExt, setPreselectedExt] = useState<any>(undefined);

  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const [statusEditInspection, setStatusEditInspection] = useState<Inspection | null>(null);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const isInspectorOrAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_INSPECTOR';

  const fetchInspections = async () => {
    setIsLoading(true);
    try {
      if (USE_REAL_API) {
        // Fetch inspections
        const params = statusFilter !== 'ALL' ? { status: statusFilter, limit: 100 } : { limit: 100 };
        const res = await inspectionApi.getAll(params);
        setInspections(res.data);
      } else {
        setInspections(mockInspections);
      }
    } catch {
      toast.error('Failed to load inspections. Using mock data instead.');
      setInspections(mockInspections);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInspections();
  }, [statusFilter]);

  // Handle redirect from ExtinguisherList schedule button
  useEffect(() => {
    if (location.state && location.state.scheduleFor) {
      setPreselectedExt(location.state.scheduleFor);
      setIsFormOpen(true);
      // Clean state so it doesn't reopen on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Client-side filter fallback / search filter
  const filteredInspections = inspections.filter((insp) => {
    if (statusFilter === 'ALL') return true;
    return insp.status === statusFilter;
  });

  // Pagination
  const totalPages = Math.ceil(filteredInspections.length / ITEMS_PER_PAGE);
  const paginatedInspections = filteredInspections.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleViewDetails = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setIsDetailsOpen(true);
  };

  const handleEditStatusClick = (inspection: Inspection) => {
    setStatusEditInspection(inspection);
    setNewStatus(inspection.status);
    setIsStatusOpen(true);
  };

  const handleUpdateStatus = async () => {
    if (!statusEditInspection) return;
    setIsUpdatingStatus(true);
    try {
      if (USE_REAL_API) {
        await inspectionApi.updateStatus(statusEditInspection.id, newStatus);
      } else {
        // Mock update
        setInspections((prev) =>
          prev.map((i) => (i.id === statusEditInspection.id ? { ...i, status: newStatus as any } : i))
        );
      }
      toast.success('Inspection status updated successfully.');
      fetchInspections();
    } catch {
      toast.error('Failed to update inspection status.');
    } finally {
      setIsUpdatingStatus(false);
      setIsStatusOpen(false);
      setStatusEditInspection(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Inspections</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track and schedule safety inspections for extinguishers.
          </p>
        </div>
        <Button
          onClick={() => {
            setPreselectedExt(undefined);
            setIsFormOpen(true);
          }}
          className="bg-primary text-primary-foreground font-semibold flex items-center gap-2 rounded-md px-4 py-2 hover:opacity-90 transition duration-200"
        >
          <Plus className="h-4 w-4" />
          Schedule Inspection
        </Button>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-card border-border shadow-sm rounded-md flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[180px] bg-background border-border text-foreground rounded-md">
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="SCHEDULED">Scheduled</SelectItem>
              <SelectItem value="ONGOING">Ongoing</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-xs text-muted-foreground">
          Showing <span className="font-semibold text-foreground">{filteredInspections.length}</span> inspections
        </p>
      </Card>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 bg-card border border-border rounded-md">
          <p className="text-sm text-muted-foreground">Loading inspections...</p>
        </div>
      ) : (
        <Card className="p-0 overflow-hidden border-border bg-card shadow-sm rounded-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Serial No</TableHead>
                  <TableHead className="font-semibold text-foreground">Location</TableHead>
                  <TableHead className="font-semibold text-foreground">Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Time</TableHead>
                  <TableHead className="font-semibold text-foreground">Inspector</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedInspections.map((item) => (
                    <TableRow key={item.id} className="border-b border-border hover:bg-muted/20">
                      <TableCell className="font-medium text-foreground">
                        {item.extinguisher?.serialNumber || 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.extinguisher?.location || 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.inspectionDate.split('T')[0]}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.inspectionTime}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.inspector
                          ? `${item.inspector.firstName} ${item.inspector.lastName}`
                          : 'Unassigned'}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {/* View details */}
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Details"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => handleViewDetails(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {/* Update status (Inspector/Admin only) */}
                          {isInspectorOrAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Update Status"
                              className="text-muted-foreground hover:text-primary hover:bg-muted"
                              onClick={() => handleEditStatusClick(item)}
                            >
                              <CheckSquare className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Quick action: Log Maintenance (Only if COMPLETED and user is Inspector/Admin) */}
                          {isInspectorOrAdmin && item.status === 'COMPLETED' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Log Maintenance"
                              className="text-green-600 hover:text-green-800 hover:bg-green-500/10"
                              onClick={() => navigate('/maintenance', { state: { logFor: item } })}
                            >
                              <Wrench className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <PaginationControls
            page={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
          />
        </Card>
      )}

      {/* Schedule Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border text-foreground rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Schedule Inspection</DialogTitle>
          </DialogHeader>
          <InspectionForm
            preselectedExtinguisher={preselectedExt}
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchInspections();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[500px] bg-card border-border text-foreground rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Inspection Details</DialogTitle>
          </DialogHeader>
          {selectedInspection && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-md border border-border">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Extinguisher
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedInspection.extinguisher?.serialNumber || 'N/A'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Type: {selectedInspection.extinguisher?.type || 'N/A'} ({selectedInspection.extinguisher?.size || 'N/A'})
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> Location
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedInspection.extinguisher?.location || 'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date Scheduled</p>
                    <p className="text-sm font-medium text-foreground">{selectedInspection.inspectionDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Time Slot</p>
                    <p className="text-sm font-medium text-foreground">{selectedInspection.inspectionTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned Inspector</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedInspection.inspector
                        ? `${selectedInspection.inspector.firstName} ${selectedInspection.inspector.lastName} (${selectedInspection.inspector.email})`
                        : 'Unassigned'}
                    </p>
                  </div>
                </div>
                {selectedInspection.user && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Scheduled By</p>
                      <p className="text-sm font-medium text-foreground">
                        {selectedInspection.user.firstName} {selectedInspection.user.lastName} ({selectedInspection.user.email})
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Inspection Status</span>
                  <StatusBadge status={selectedInspection.status} />
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-border">
                <Button onClick={() => setIsDetailsOpen(false)} className="rounded-md">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Status Dialog */}
      <Dialog open={isStatusOpen} onOpenChange={setIsStatusOpen}>
        <DialogContent className="sm:max-w-[420px] bg-card border-border text-foreground rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Update Status</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Select the new status for this inspection log.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status
              </label>
              <Select value={newStatus} onValueChange={setNewStatus} disabled={isUpdatingStatus}>
                <SelectTrigger className="bg-background border-border text-foreground rounded-md">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border text-foreground">
                  {statusOptions.map((st) => (
                    <SelectItem key={st} value={st}>
                      {st}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsStatusOpen(false)}
              disabled={isUpdatingStatus}
              className="border-border text-foreground rounded-md"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={isUpdatingStatus}
              className="bg-primary text-primary-foreground font-semibold rounded-md hover:opacity-90"
            >
              {isUpdatingStatus ? 'Updating...' : 'Update'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
