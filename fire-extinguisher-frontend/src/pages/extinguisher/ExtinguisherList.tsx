import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { extinguisherApi } from '../../api/extinguisher';
import type { Extinguisher } from '../../mock/mockData';
import { mockExtinguishers } from '../../mock/mockData';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Search, Edit, Trash2, CalendarPlus, Flame, ShieldCheck, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '../../components/StatusBadge';
import PaginationControls from '../../components/PaginationControls';
import ConfirmDialog from '../../components/ConfirmDialog';
import ExtinguisherForm from './ExtinguisherForm';
import { useNavigate } from 'react-router-dom';

const ITEMS_PER_PAGE = 10;
const USE_REAL_API = true; // Easily toggle back to mock if needed

export default function ExtinguisherList() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedExtinguisher, setSelectedExtinguisher] = useState<Extinguisher | undefined>(undefined);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isAdminOrInspector = user?.role === 'ROLE_ADMIN' || user?.role === 'ROLE_INSPECTOR';
  const isAdmin = user?.role === 'ROLE_ADMIN';

  const fetchExtinguishers = async () => {
    setIsLoading(true);
    try {
      if (USE_REAL_API) {
        // Fetch up to 200 extinguishers to allow robust client-side filtering/searching
        const res = await extinguisherApi.getAll({ page: 1, limit: 200 });
        setExtinguishers(res.data);
      } else {
        setExtinguishers(mockExtinguishers);
      }
    } catch (err: any) {
      toast.error('Failed to load extinguishers. Using mock data instead.');
      setExtinguishers(mockExtinguishers);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExtinguishers();
  }, []);

  // Filtered List
  const currentDate = new Date('2026-06-03T11:12:13+02:00'); // Use standard local date
  const filteredExtinguishers = extinguishers.filter((item) => {
    // 1. Search text (serial number or location)
    const matchesSearch =
      item.serialNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.location.toLowerCase().includes(search.toLowerCase());

    // 2. Status check (Auto-expire operational if past expiry)
    let computedStatus = item.status;
    if (item.status === 'OPERATIONAL' && new Date(item.expiryDate) < currentDate) {
      computedStatus = 'EXPIRED';
    }

    const matchesStatus = statusFilter === 'ALL' || computedStatus === statusFilter;

    // 3. Type check
    const matchesType = typeFilter === 'ALL' || item.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Dynamic Stats based on filtered data
  const totalCount = filteredExtinguishers.length;
  const operationalCount = filteredExtinguishers.filter(
    (e) => e.status === 'OPERATIONAL' && new Date(e.expiryDate) >= currentDate
  ).length;
  const expiredCount = filteredExtinguishers.filter(
    (e) => e.status === 'EXPIRED' || new Date(e.expiryDate) < currentDate
  ).length;

  // Pagination calculations
  const totalPages = Math.ceil(filteredExtinguishers.length / ITEMS_PER_PAGE);
  const paginatedExtinguishers = filteredExtinguishers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleEdit = (extinguisher: Extinguisher) => {
    setSelectedExtinguisher(extinguisher);
    setIsFormOpen(true);
  };

  const handleAdd = () => {
    setSelectedExtinguisher(undefined);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (deleteId === null) return;
    setIsDeleting(true);
    try {
      if (USE_REAL_API) {
        await extinguisherApi.delete(deleteId);
      }
      toast.success('Extinguisher deleted successfully.');
      fetchExtinguishers();
    } catch (err: any) {
      toast.error('Failed to delete extinguisher.');
    } finally {
      setIsDeleting(false);
      setIsDeleteOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Extinguisher Inventory</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your fire safety extinguishers and track their status.
          </p>
        </div>
        {isAdminOrInspector && (
          <Button
            onClick={handleAdd}
            className="bg-primary text-primary-foreground font-semibold flex items-center gap-2 rounded-md px-4 py-2 hover:opacity-90 transition duration-200"
          >
            <Plus className="h-4 w-4" />
            Add Extinguisher
          </Button>
        )}
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 space-y-1 bg-card border-border shadow-sm rounded-md transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground font-medium">Total Extinguishers</p>
            <div className="p-2 bg-primary/10 rounded-full">
              <Flame className="h-4 w-4 text-primary" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalCount}</p>
        </Card>
        <Card className="p-4 space-y-1 bg-card border-border shadow-sm rounded-md transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground font-medium">Operational</p>
            <div className="p-2 bg-green-500/10 rounded-full">
              <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{operationalCount}</p>
        </Card>
        <Card className="p-4 space-y-1 bg-card border-border shadow-sm rounded-md transition-all duration-300 hover:shadow-md">
          <div className="flex justify-between items-center">
            <p className="text-sm text-muted-foreground font-medium">Expired / Attention Required</p>
            <div className="p-2 bg-destructive/10 rounded-full">
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground text-destructive">{expiredCount}</p>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="p-4 bg-card border-border shadow-sm rounded-md flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Serial No / Location..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-10 bg-background border-border text-foreground rounded-md focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-wrap w-full md:w-auto gap-4 items-center justify-end">
          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
            <Select
              value={statusFilter}
              onValueChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] bg-background border-border text-foreground rounded-md">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="OPERATIONAL">Operational</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="DECOMMISSIONED">Decommissioned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type:</span>
            <Select
              value={typeFilter}
              onValueChange={(val) => {
                setTypeFilter(val);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="w-[140px] bg-background border-border text-foreground rounded-md">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border text-foreground">
                <SelectItem value="ALL">All Types</SelectItem>
                <SelectItem value="WATER">Water</SelectItem>
                <SelectItem value="CO2">CO2</SelectItem>
                <SelectItem value="FOAM">Foam</SelectItem>
                <SelectItem value="DRY_CHEMICAL">Dry Chemical</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 bg-card border border-border rounded-md">
          <p className="text-sm text-muted-foreground">Loading extinguishers...</p>
        </div>
      ) : (
        <Card className="p-0 overflow-hidden border-border bg-card shadow-sm rounded-md">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50 border-b border-border">
                <TableRow>
                  <TableHead className="font-semibold text-foreground">Serial No</TableHead>
                  <TableHead className="font-semibold text-foreground">Location</TableHead>
                  <TableHead className="font-semibold text-foreground">Type</TableHead>
                  <TableHead className="font-semibold text-foreground">Size</TableHead>
                  <TableHead className="font-semibold text-foreground">Installation Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Expiry Date</TableHead>
                  <TableHead className="font-semibold text-foreground">Status</TableHead>
                  {user && <TableHead className="font-semibold text-foreground text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedExtinguishers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedExtinguishers.map((item) => {
                    const isItemExpired = new Date(item.expiryDate) < currentDate;
                    const displayStatus = (item.status === 'OPERATIONAL' && isItemExpired) ? 'EXPIRED' : item.status;
                    return (
                      <TableRow key={item.id} className="border-b border-border hover:bg-muted/20">
                        <TableCell className="font-medium text-foreground">{item.serialNumber}</TableCell>
                        <TableCell className="text-muted-foreground">{item.location}</TableCell>
                        <TableCell className="text-muted-foreground">{item.type.replace('_', ' ')}</TableCell>
                        <TableCell className="text-muted-foreground">{item.size}</TableCell>
                        <TableCell className="text-muted-foreground">{item.installationDate.split('T')[0]}</TableCell>
                        <TableCell className={`text-muted-foreground ${isItemExpired ? 'text-destructive font-semibold' : ''}`}>
                          {item.expiryDate.split('T')[0]}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={displayStatus} />
                        </TableCell>
                        {user && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {/* Schedule Inspection Button (available for all authenticated roles) */}
                              <Button
                                variant="ghost"
                                size="icon"
                                title="Schedule Inspection"
                                className="text-muted-foreground hover:text-primary hover:bg-muted"
                                onClick={() => navigate('/inspections', { state: { scheduleFor: item } })}
                              >
                                <CalendarPlus className="h-4 w-4" />
                              </Button>
                              {/* Edit Action (Admin/Inspector only) */}
                              {isAdminOrInspector && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Edit Extinguisher"
                                  className="text-muted-foreground hover:text-foreground hover:bg-muted"
                                  onClick={() => handleEdit(item)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              )}
                              {/* Delete Action (Admin only) */}
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Delete Extinguisher"
                                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => handleDeleteClick(item.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
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

      {/* Form Dialog Modal */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px] bg-card border-border text-foreground rounded-lg shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              {selectedExtinguisher ? 'Edit Extinguisher' : 'Add Extinguisher'}
            </DialogTitle>
          </DialogHeader>
          <ExtinguisherForm
            extinguisher={selectedExtinguisher}
            onClose={() => setIsFormOpen(false)}
            onSuccess={() => {
              setIsFormOpen(false);
              fetchExtinguishers();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Extinguisher"
        description="Are you sure you want to delete this extinguisher? This action will permanently remove it from the system."
        isLoading={isDeleting}
      />
    </div>
  );
}
