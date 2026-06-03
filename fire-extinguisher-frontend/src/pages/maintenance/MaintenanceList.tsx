import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { maintenanceApi } from '../../api/maintenance';
import { Maintenance, mockMaintenance } from '../../mock/mockData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Eye, Wrench, ShieldCheck, ClipboardCheck, Calendar, User } from 'lucide-react';
import { toast } from 'sonner';
import PaginationControls from '../../components/PaginationControls';
import MaintenanceForm from './MaintenanceForm';

const ITEMS_PER_PAGE = 10;
const USE_REAL_API = true;

export default function MaintenanceList() {
  const { user } = useAuth();
  const location = useLocation();

  const [maintenanceLogs, setMaintenanceLogs] = useState<Maintenance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMaint, setSelectedMaint] = useState<Maintenance | undefined>(undefined);
  const [preselectedInsp, setPreselectedInsp] = useState<any>(undefined);

  const [selectedDetails, setSelectedDetails] = useState<Maintenance | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const isInspectorOrAdmin = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_INSPECTOR';

  const fetchMaintenance = async () => {
    setIsLoading(true);
    try {
      if (USE_REAL_API) {
        const res = await maintenanceApi.getAll({ page: 1, limit: 100 });
        setMaintenanceLogs(res.data);
      } else {
        setMaintenanceLogs(mockMaintenance);
      }
    } catch {
      toast.error('Failed to load maintenance logs. Using mock data.');
      setMaintenanceLogs(mockMaintenance);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenance();
  }, []);

  // Handle redirect from InspectionList Log Maintenance button
  useEffect(() => {
    if (location.state && location.state.logFor) {
      setPreselectedInsp(location.state.logFor);
      setSelectedMaint(undefined);
      setIsFormOpen(true);
      // Clean location state so modal doesn't reopen
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Pagination calculations
  const totalPages = Math.ceil(maintenanceLogs.length / ITEMS_PER_PAGE);
  const paginatedLogs = maintenanceLogs.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleEdit = (maint: Maintenance) => {
    setSelectedMaint(maint);
    setPreselectedInsp(undefined);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedMaint(undefined);
    setPreselectedInsp(undefined);
    setIsFormOpen(true);
  };

  const handleViewDetails = (maint: Maintenance) => {
    setSelectedDetails(maint);
    setIsDetailsOpen(true);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Maintenance History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Browse and log extinguisher maintenance actions and updates.
          </p>
        </div>
        {isInspectorOrAdmin && (
          <Button
            onClick={handleAdd}
            className="bg-primary text-primary-foreground font-semibold flex items-center gap-2 rounded-md px-4 py-2 hover:opacity-90 transition duration-200"
          >
            <Plus className="h-4 w-4" />
            Log Maintenance
          </Button>
        )}
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 bg-card border border-border rounded-md">
          <p className="text-sm text-muted-foreground">Loading maintenance logs...</p>
        </div>
      ) : (
        <Card className="p-0 overflow-hidden border-border bg-card shadow-sm rounded-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Serial No</TableHead>
                  <TableHead className="font-semibold text-foreground">Inspection Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Maintenance Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Inspector</TableHead>
                  <TableHead className="font-semibold text-foreground">Conditions Noted</TableHead>
                  <TableHead className="font-semibold text-foreground">Actions Taken</TableHead>
                  <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedLogs.map((item) => (
                    <TableRow key={item.id} className="border-b border-border hover:bg-muted/20">
                      <TableCell className="font-medium text-foreground">
                        {item.inspection?.serialNumber || 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.inspection?.inspectionDate ? item.inspection.inspectionDate.split('T')[0] : 'N/A'}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.maintenanceDate.split('T')[0]}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {item.inspector
                          ? `${item.inspector.firstName} ${item.inspector.lastName}`
                          : 'Unknown'}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {item.conditionsNoted}
                      </TableCell>
                      <TableCell className="text-muted-foreground max-w-xs truncate">
                        {item.actions}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="View Details"
                            className="text-muted-foreground hover:text-foreground hover:bg-muted"
                            onClick={() => handleViewDetails(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>

                          {isInspectorOrAdmin && (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Edit Record"
                              className="text-muted-foreground hover:text-primary hover:bg-muted"
                              onClick={() => handleEdit(item)}
                            >
                              <Edit className="h-4 w-4" />
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

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border text-foreground rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              {selectedMaint ? 'Edit Maintenance Record' : 'Log Maintenance'}
            </DialogTitle>
          </DialogHeader>
          <MaintenanceForm
            maintenance={selectedMaint}
            preselectedInspection={preselectedInsp}
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchMaintenance();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border text-foreground rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">Maintenance Details</DialogTitle>
          </DialogHeader>
          {selectedDetails && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-4 bg-muted/40 p-4 rounded-md border border-border">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Extinguisher
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedDetails.inspection?.serialNumber || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider flex items-center gap-1">
                    <ClipboardCheck className="h-3 w-3" /> Inspection ID
                  </span>
                  <p className="text-sm font-semibold text-foreground">
                    #{selectedDetails.inspectionId}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Maintenance Date</p>
                    <p className="text-sm font-medium text-foreground">{selectedDetails.maintenanceDate.split('T')[0]}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Logged By (Inspector)</p>
                    <p className="text-sm font-medium text-foreground">
                      {selectedDetails.inspector
                        ? `${selectedDetails.inspector.firstName} ${selectedDetails.inspector.lastName} (${selectedDetails.inspector.email})`
                        : 'Unknown'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Wrench className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Conditions Noted</p>
                    <p className="text-sm text-foreground bg-muted/30 p-2 rounded border border-border mt-1 font-mono text-xs">
                      {selectedDetails.conditionsNoted}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Wrench className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Actions Performed</p>
                    <p className="text-sm text-foreground bg-muted/30 p-2 rounded border border-border mt-1 font-mono text-xs">
                      {selectedDetails.actions}
                    </p>
                  </div>
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
    </div>
  );
}
