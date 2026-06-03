import { useState, useEffect } from 'react';
import { maintenanceApi } from '../../api/maintenance';
import { inspectionApi } from '../../api/inspection';
import type { Inspection, Maintenance } from '../../mock/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface MaintenanceFormProps {
  maintenance?: Maintenance;
  preselectedInspection?: Inspection;
  onSuccess: () => void;
  onClose: () => void;
}

export default function MaintenanceForm({
  maintenance,
  preselectedInspection,
  onSuccess,
  onClose,
}: MaintenanceFormProps) {
  const [completedInspections, setCompletedInspections] = useState<Inspection[]>([]);
  const [inspectionId, setInspectionId] = useState<string>('');
  const [actions, setActions] = useState('');
  const [conditionsNoted, setConditionsNoted] = useState('');
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [isLoadingInspections, setIsLoadingInspections] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isEdit = !!maintenance;

  useEffect(() => {
    const fetchInsps = async () => {
      setIsLoadingInspections(true);
      try {
        const res = await inspectionApi.getAll({ status: 'COMPLETED', limit: 100 });
        setCompletedInspections(res.data);
      } catch {
        toast.error('Failed to load completed inspections.');
      } finally {
        setIsLoadingInspections(false);
      }
    };

    if (!isEdit && !preselectedInspection) {
      fetchInsps();
    }
  }, [isEdit, preselectedInspection]);

  useEffect(() => {
    if (maintenance) {
      setInspectionId(maintenance.inspectionId.toString());
      setActions(maintenance.actions);
      setConditionsNoted(maintenance.conditionsNoted);
      setMaintenanceDate(maintenance.maintenanceDate.split('T')[0]);
    } else if (preselectedInspection) {
      setInspectionId(preselectedInspection.id.toString());
      setMaintenanceDate(new Date().toISOString().split('T')[0]);
    } else {
      setMaintenanceDate(new Date().toISOString().split('T')[0]);
    }
  }, [maintenance, preselectedInspection]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inspectionId || !actions || !conditionsNoted || !maintenanceDate) {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        inspectionId: parseInt(inspectionId),
        actions,
        conditionsNoted,
        maintenanceDate,
      };

      if (isEdit && maintenance) {
        await maintenanceApi.update(maintenance.id, payload);
        toast.success('Maintenance record updated successfully.');
      } else {
        await maintenanceApi.create(payload);
        toast.success('Maintenance logged successfully.');
      }
      onSuccess();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to save maintenance record.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Inspection Select */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Completed Inspection *
        </label>
        {isEdit && maintenance ? (
          <Input
            value={`Inspection #${maintenance.inspectionId} (Extinguisher: ${maintenance.inspection?.serialNumber || 'N/A'})`}
            disabled
            className="bg-muted border-border text-foreground rounded-md cursor-not-allowed"
          />
        ) : preselectedInspection ? (
          <Input
            value={`Inspection #${preselectedInspection.id} (Extinguisher: ${preselectedInspection.extinguisher?.serialNumber || 'N/A'})`}
            disabled
            className="bg-muted border-border text-foreground rounded-md cursor-not-allowed"
          />
        ) : (
          <Select
            value={inspectionId}
            onValueChange={setInspectionId}
            disabled={isLoadingInspections || isLoading}
          >
            <SelectTrigger className="bg-background border-border text-foreground rounded-md">
              <SelectValue placeholder={isLoadingInspections ? 'Loading...' : 'Select completed inspection'} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              {completedInspections.map((insp) => (
                <SelectItem key={insp.id} value={insp.id.toString()}>
                  ID: {insp.id} | Ext: {insp.extinguisher?.serialNumber} | Date: {insp.inspectionDate.split('T')[0]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Conditions Noted */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Conditions Noted *
        </label>
        <Input
          placeholder="e.g. Pressure low, nozzle dusty"
          value={conditionsNoted}
          onChange={(e) => setConditionsNoted(e.target.value)}
          required
          disabled={isLoading}
          className="bg-background border-border text-foreground rounded-md"
        />
      </div>

      {/* Actions Taken */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Actions Performed *
        </label>
        <Input
          placeholder="e.g. Recharged cylinder, wiped bracket"
          value={actions}
          onChange={(e) => setActions(e.target.value)}
          required
          disabled={isLoading}
          className="bg-background border-border text-foreground rounded-md"
        />
      </div>

      {/* Maintenance Date */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Maintenance Date *
        </label>
        <Input
          type="date"
          value={maintenanceDate}
          onChange={(e) => setMaintenanceDate(e.target.value)}
          required
          disabled={isLoading}
          className="bg-background border-border text-foreground rounded-md"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          className="border-border text-foreground rounded-md"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-primary text-primary-foreground font-semibold rounded-md px-6 hover:opacity-90 transition duration-200"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  );
}
