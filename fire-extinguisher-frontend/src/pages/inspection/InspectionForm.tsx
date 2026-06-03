import React, { useState, useEffect } from 'react';
import { inspectionApi } from '../../api/inspection';
import { extinguisherApi } from '../../api/extinguisher';
import { Extinguisher } from '../../mock/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface InspectionFormProps {
  preselectedExtinguisher?: Extinguisher;
  onSuccess: () => void;
  onClose: () => void;
}

// Matching database seed inspectors
const mockInspectors = [
  { id: 2, name: 'Inspector One (inspector1@tzw.rw)' },
  { id: 3, name: 'Inspector Two (inspector2@tzw.rw)' },
];

export default function InspectionForm({
  preselectedExtinguisher,
  onSuccess,
  onClose,
}: InspectionFormProps) {
  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [extinguisherId, setExtinguisherId] = useState<string>('');
  const [inspectorId, setInspectorId] = useState<string>('unassigned');
  const [inspectionDate, setInspectionDate] = useState('');
  const [inspectionTime, setInspectionTime] = useState('');
  const [isLoadingExtinguishers, setIsLoadingExtinguishers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchExts = async () => {
      setIsLoadingExtinguishers(true);
      try {
        const res = await extinguisherApi.getAll({ page: 1, limit: 100 });
        setExtinguishers(res.data);
      } catch {
        toast.error('Failed to load extinguishers list.');
      } finally {
        setIsLoadingExtinguishers(false);
      }
    };
    fetchExts();
  }, []);

  useEffect(() => {
    if (preselectedExtinguisher) {
      setExtinguisherId(preselectedExtinguisher.id.toString());
    }
  }, [preselectedExtinguisher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!extinguisherId || !inspectionDate || !inspectionTime) {
      toast.error('Please select an extinguisher, date, and time.');
      return;
    }

    setIsLoading(true);
    try {
      // Backend validates HH:MM or HH:MM:SS format
      const formattedTime = inspectionTime.length === 5 ? `${inspectionTime}:00` : inspectionTime;

      await inspectionApi.create({
        extinguisherId: parseInt(extinguisherId),
        inspectorId: inspectorId === 'unassigned' ? null : parseInt(inspectorId),
        inspectionDate,
        inspectionTime: formattedTime,
      });

      toast.success('Inspection scheduled successfully.');
      onSuccess();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to schedule inspection.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Extinguisher select */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Extinguisher *
        </label>
        {preselectedExtinguisher ? (
          <Input
            value={`${preselectedExtinguisher.serialNumber} (${preselectedExtinguisher.location})`}
            disabled
            className="bg-muted border-border text-foreground rounded-md cursor-not-allowed"
          />
        ) : (
          <Select
            value={extinguisherId}
            onValueChange={setExtinguisherId}
            disabled={isLoadingExtinguishers || isLoading}
          >
            <SelectTrigger className="bg-background border-border text-foreground rounded-md">
              <SelectValue placeholder={isLoadingExtinguishers ? 'Loading...' : 'Select extinguisher'} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              {extinguishers.map((ext) => (
                <SelectItem key={ext.id} value={ext.id.toString()}>
                  {ext.serialNumber} ({ext.location} - {ext.type})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Inspector select */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Assign Inspector
        </label>
        <Select
          value={inspectorId}
          onValueChange={setInspectorId}
          disabled={isLoading}
        >
          <SelectTrigger className="bg-background border-border text-foreground rounded-md">
            <SelectValue placeholder="Select inspector" />
          </SelectTrigger>
          <SelectContent className="bg-card border-border text-foreground">
            <SelectItem value="unassigned">Unassigned (Choose Later)</SelectItem>
            {mockInspectors.map((ins) => (
              <SelectItem key={ins.id} value={ins.id.toString()}>
                {ins.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date & Time picker */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Inspection Date *
          </label>
          <Input
            type="date"
            value={inspectionDate}
            onChange={(e) => setInspectionDate(e.target.value)}
            required
            disabled={isLoading}
            className="bg-background border-border text-foreground rounded-md"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Inspection Time *
          </label>
          <Input
            type="time"
            value={inspectionTime}
            onChange={(e) => setInspectionTime(e.target.value)}
            required
            disabled={isLoading}
            className="bg-background border-border text-foreground rounded-md"
          />
        </div>
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
          {isLoading ? 'Scheduling...' : 'Schedule'}
        </Button>
      </div>
    </form>
  );
}
