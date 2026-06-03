import React, { useState, useEffect } from 'react';
import { reportsApi } from '../../api/reports';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Flame, ShieldAlert, ClipboardCheck, Wrench, ShieldCheck, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import StatusBadge from '../../components/StatusBadge';
import PaginationControls from '../../components/PaginationControls';
import ExportButtons from '../../components/ExportButtons';

const LIMIT = 5; // Smaller page size for tab lists

export default function Reports() {
  const [activeTab, setActiveTab] = useState('stock');

  // Loading states
  const [isLoading, setIsLoading] = useState(false);

  // Pagination states
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Common filters
  const [fromFilter, setFromFilter] = useState('');
  const [toFilter, setToFilter] = useState('');

  // 1. Stock Tab states
  const [stockData, setStockData] = useState<any[]>([]);
  const [stockPeriod, setStockPeriod] = useState<'daily' | 'monthly' | 'yearly'>('monthly');
  const [stockDate, setStockDate] = useState('');

  // 2. Expired Tab states
  const [expiredData, setExpiredData] = useState<any[]>([]);

  // 3. Inspections Tab states
  const [inspectionsData, setInspectionsData] = useState<any[]>([]);
  const [inspStatus, setInspStatus] = useState('ALL');

  // 4. Maintenance Tab states
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [maintExtId, setMaintExtId] = useState('');

  // 5. Compliance Tab states
  const [complianceData, setComplianceData] = useState<any[]>([]);

  // Load active tab data
  const loadReportData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'stock') {
        const res = await reportsApi.getStockReport({
          format: 'json',
          period: stockPeriod,
          date: stockDate || undefined,
          page,
          limit: LIMIT,
        });
        setStockData(res.data || []);
        setTotalPages(res.totalPages || 1);
      } else if (activeTab === 'expired') {
        const res = await reportsApi.getExpiredReport({
          format: 'json',
          page,
          limit: LIMIT,
        });
        setExpiredData(res.data || []);
        setTotalPages(res.totalPages || 1);
      } else if (activeTab === 'inspections') {
        const res = await reportsApi.getInspectionStatusReport({
          format: 'json',
          status: inspStatus === 'ALL' ? undefined : inspStatus,
          from: fromFilter || undefined,
          to: toFilter || undefined,
          page,
          limit: LIMIT,
        });
        setInspectionsData(res.data || []);
        setTotalPages(res.totalPages || 1);
      } else if (activeTab === 'maintenance') {
        const res = await reportsApi.getMaintenanceHistoryReport({
          format: 'json',
          extinguisherId: maintExtId ? parseInt(maintExtId) : undefined,
          from: fromFilter || undefined,
          to: toFilter || undefined,
          page,
          limit: LIMIT,
        });
        setMaintenanceData(res.data || []);
        setTotalPages(res.totalPages || 1);
      } else if (activeTab === 'compliance') {
        const res = await reportsApi.getComplianceReport({
          format: 'json',
          page,
          limit: LIMIT,
        });
        setComplianceData(res.data || []);
        setTotalPages(res.totalPages || 1);
      }
    } catch (err) {
      toast.error('Failed to load report data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, [activeTab, page, stockPeriod, stockDate, inspStatus, fromFilter, toFilter, maintExtId]);

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setPage(1);
    setTotalPages(1);
    // Reset filters
    setFromFilter('');
    setToFilter('');
    setMaintExtId('');
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-primary" /> Reports & Analytics
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate and export CSV/PDF compliance and inventory logs.
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-muted border border-border rounded-md p-1 flex gap-1 overflow-x-auto w-full md:w-max">
          <TabsTrigger value="stock" className="rounded-sm px-4 py-2 text-sm font-medium">
            Stock Overview
          </TabsTrigger>
          <TabsTrigger value="expired" className="rounded-sm px-4 py-2 text-sm font-medium">
            Expired Inventory
          </TabsTrigger>
          <TabsTrigger value="inspections" className="rounded-sm px-4 py-2 text-sm font-medium">
            Inspections Log
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="rounded-sm px-4 py-2 text-sm font-medium">
            Maintenance History
          </TabsTrigger>
          <TabsTrigger value="compliance" className="rounded-sm px-4 py-2 text-sm font-medium">
            Compliance
          </TabsTrigger>
        </TabsList>

        {/* 1. Stock Tab */}
        <TabsContent value="stock" className="space-y-4">
          <Card className="p-4 bg-card border-border shadow-sm rounded-md flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Period:</span>
                <Select
                  value={stockPeriod}
                  onValueChange={(val: any) => {
                    setStockPeriod(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[120px] bg-background border-border text-foreground rounded-md">
                    <SelectValue placeholder="Monthly" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border text-foreground">
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Reference Date:</span>
                <Input
                  type="date"
                  value={stockDate}
                  onChange={(e) => {
                    setStockDate(e.target.value);
                    setPage(1);
                  }}
                  className="bg-background border-border text-foreground rounded-md w-[160px]"
                />
              </div>
            </div>

            <ExportButtons
              reportName="stock"
              onExport={(format) =>
                reportsApi.getStockReport({
                  format,
                  period: stockPeriod,
                  date: stockDate || undefined,
                })
              }
            />
          </Card>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading Stock data...</div>
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
                      <TableHead className="font-semibold text-foreground">Install Date</TableHead>
                      <TableHead className="font-semibold text-foreground">Expiry Date</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stockData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stockData.map((item) => (
                        <TableRow key={item.id} className="border-b border-border hover:bg-muted/20">
                          <TableCell className="font-medium text-foreground">{item.serialNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{item.location}</TableCell>
                          <TableCell className="text-muted-foreground">{item.type}</TableCell>
                          <TableCell className="text-muted-foreground">{item.size}</TableCell>
                          <TableCell className="text-muted-foreground">{item.installationDate?.split('T')[0]}</TableCell>
                          <TableCell className="text-muted-foreground">{item.expiryDate?.split('T')[0]}</TableCell>
                          <TableCell>
                            <StatusBadge status={item.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            </Card>
          )}
        </TabsContent>

        {/* 2. Expired Tab */}
        <TabsContent value="expired" className="space-y-4">
          <Card className="p-4 bg-card border-border shadow-sm rounded-md flex items-center justify-between">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-destructive" /> Expired or past-expiry assets.
            </span>
            <ExportButtons
              reportName="expired"
              onExport={(format) => reportsApi.getExpiredReport({ format })}
            />
          </Card>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading Expired data...</div>
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
                      <TableHead className="font-semibold text-foreground">Expiry Date</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expiredData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          No records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      expiredData.map((item) => (
                        <TableRow key={item.id} className="border-b border-border hover:bg-muted/20">
                          <TableCell className="font-medium text-foreground">{item.serialNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{item.location}</TableCell>
                          <TableCell className="text-muted-foreground">{item.type}</TableCell>
                          <TableCell className="text-muted-foreground">{item.size}</TableCell>
                          <TableCell className="text-destructive font-semibold">{item.expiryDate?.split('T')[0]}</TableCell>
                          <TableCell>
                            <StatusBadge status="EXPIRED" />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            </Card>
          )}
        </TabsContent>

        {/* 3. Inspections Tab */}
        <TabsContent value="inspections" className="space-y-4">
          <Card className="p-4 bg-card border-border shadow-sm rounded-md flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status:</span>
                <Select
                  value={inspStatus}
                  onValueChange={(val) => {
                    setInspStatus(val);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] bg-background border-border text-foreground rounded-md">
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

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From:</span>
                <Input
                  type="date"
                  value={fromFilter}
                  onChange={(e) => {
                    setFromFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-background border-border text-foreground rounded-md w-[140px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To:</span>
                <Input
                  type="date"
                  value={toFilter}
                  onChange={(e) => {
                    setToFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-background border-border text-foreground rounded-md w-[140px]"
                />
              </div>
            </div>

            <ExportButtons
              reportName="inspections"
              onExport={(format) =>
                reportsApi.getInspectionStatusReport({
                  format,
                  status: inspStatus === 'ALL' ? undefined : inspStatus,
                  from: fromFilter || undefined,
                  to: toFilter || undefined,
                })
              }
            />
          </Card>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading Inspections data...</div>
          ) : (
            <Card className="p-0 overflow-hidden border-border bg-card shadow-sm rounded-md">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 border-b border-border">
                    <TableRow>
                      <TableHead className="font-semibold text-foreground">Inspection ID</TableHead>
                      <TableHead className="font-semibold text-foreground">User Name</TableHead>
                      <TableHead className="font-semibold text-foreground">Serial No</TableHead>
                      <TableHead className="font-semibold text-foreground">Location</TableHead>
                      <TableHead className="font-semibold text-foreground">Date</TableHead>
                      <TableHead className="font-semibold text-foreground">Time</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inspectionsData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      inspectionsData.map((item) => (
                        <TableRow key={item.id} className="border-b border-border hover:bg-muted/20">
                          <TableCell className="font-medium text-foreground">#{item.id}</TableCell>
                          <TableCell className="text-muted-foreground">{item.userName || 'System'}</TableCell>
                          <TableCell className="text-muted-foreground">{item.serialNumber || 'N/A'}</TableCell>
                          <TableCell className="text-muted-foreground">{item.location || 'N/A'}</TableCell>
                          <TableCell className="text-muted-foreground">{item.inspectionDate?.split('T')[0]}</TableCell>
                          <TableCell className="text-muted-foreground">{item.inspectionTime}</TableCell>
                          <TableCell>
                            <StatusBadge status={item.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            </Card>
          )}
        </TabsContent>

        {/* 4. Maintenance Tab */}
        <TabsContent value="maintenance" className="space-y-4">
          <Card className="p-4 bg-card border-border shadow-sm rounded-md flex flex-wrap gap-4 items-center justify-between">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Extinguisher ID:</span>
                <Input
                  placeholder="e.g. 2"
                  value={maintExtId}
                  onChange={(e) => {
                    setMaintExtId(e.target.value);
                    setPage(1);
                  }}
                  className="bg-background border-border text-foreground rounded-md w-[100px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From:</span>
                <Input
                  type="date"
                  value={fromFilter}
                  onChange={(e) => {
                    setFromFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-background border-border text-foreground rounded-md w-[140px]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">To:</span>
                <Input
                  type="date"
                  value={toFilter}
                  onChange={(e) => {
                    setToFilter(e.target.value);
                    setPage(1);
                  }}
                  className="bg-background border-border text-foreground rounded-md w-[140px]"
                />
              </div>
            </div>

            <ExportButtons
              reportName="maintenance"
              onExport={(format) =>
                reportsApi.getMaintenanceHistoryReport({
                  format,
                  extinguisherId: maintExtId ? parseInt(maintExtId) : undefined,
                  from: fromFilter || undefined,
                  to: toFilter || undefined,
                })
              }
            />
          </Card>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading Maintenance data...</div>
          ) : (
            <Card className="p-0 overflow-hidden border-border bg-card shadow-sm rounded-md">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/50 border-b border-border">
                    <TableRow>
                      <TableHead className="font-semibold text-foreground">Record ID</TableHead>
                      <TableHead className="font-semibold text-foreground">Date Logged</TableHead>
                      <TableHead className="font-semibold text-foreground">Serial No</TableHead>
                      <TableHead className="font-semibold text-foreground">Location</TableHead>
                      <TableHead className="font-semibold text-foreground">Inspector</TableHead>
                      <TableHead className="font-semibold text-foreground">Actions Performed</TableHead>
                      <TableHead className="font-semibold text-foreground">Conditions Noted</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {maintenanceData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      maintenanceData.map((item) => (
                        <TableRow key={item.id} className="border-b border-border hover:bg-muted/20">
                          <TableCell className="font-medium text-foreground">#{item.id}</TableCell>
                          <TableCell className="text-muted-foreground">{item.maintenanceDate?.split('T')[0]}</TableCell>
                          <TableCell className="text-muted-foreground">{item.serialNumber || 'N/A'}</TableCell>
                          <TableCell className="text-muted-foreground">{item.location || 'N/A'}</TableCell>
                          <TableCell className="text-muted-foreground">{item.inspectorName || 'Unknown'}</TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">{item.actions}</TableCell>
                          <TableCell className="text-muted-foreground max-w-xs truncate">{item.conditionsNoted}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            </Card>
          )}
        </TabsContent>

        {/* 5. Compliance Tab */}
        <TabsContent value="compliance" className="space-y-4">
          <Card className="p-4 bg-card border-border shadow-sm rounded-md flex items-center justify-between">
            <span className="text-sm font-medium text-foreground flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-yellow-600" /> Extinguishers with NO completed inspection in the last 12 months.
            </span>
            <ExportButtons
              reportName="compliance"
              onExport={(format) => reportsApi.getComplianceReport({ format })}
            />
          </Card>

          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading Compliance data...</div>
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
                      <TableHead className="font-semibold text-foreground">Install Date</TableHead>
                      <TableHead className="font-semibold text-foreground">Expiry Date</TableHead>
                      <TableHead className="font-semibold text-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {complianceData.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No non-compliant records found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      complianceData.map((item) => (
                        <TableRow key={item.id} className="border-b border-border hover:bg-muted/20">
                          <TableCell className="font-medium text-foreground">{item.serialNumber}</TableCell>
                          <TableCell className="text-muted-foreground">{item.location}</TableCell>
                          <TableCell className="text-muted-foreground">{item.type}</TableCell>
                          <TableCell className="text-muted-foreground">{item.size}</TableCell>
                          <TableCell className="text-muted-foreground">{item.installationDate?.split('T')[0]}</TableCell>
                          <TableCell className="text-muted-foreground">{item.expiryDate?.split('T')[0]}</TableCell>
                          <TableCell>
                            <StatusBadge status={item.status} />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
              <PaginationControls page={page} totalPages={totalPages} onPageChange={setPage} />
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
