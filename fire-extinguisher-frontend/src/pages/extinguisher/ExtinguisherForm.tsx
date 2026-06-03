import { useState, useEffect } from 'react';
import type { Extinguisher } from '../../mock/mockData';
import { extinguisherApi } from '../../api/extinguisher';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface ExtinguisherFormProps {
  extinguisher?: Extinguisher;
  onSuccess: () => void;
  onClose: () => void;
}

const extinguisherTypes = ['WATER', 'CO2', 'FOAM', 'DRY_CHEMICAL'];
const extinguisherSizes = ['2.5LBS', '5LBS', '9LBS', '12LBS'];
const statusOptions = ['OPERATIONAL', 'EXPIRED', 'DECOMMISSIONED'];

export default function ExtinguisherForm({ extinguisher, onSuccess, onClose }: ExtinguisherFormProps) {
  const [serialNumber, setSerialNumber] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<Extinguisher['type']>('DRY_CHEMICAL');
  const [size, setSize] = useState<Extinguisher['size']>('5LBS');
  const [installationDate, setInstallationDate] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [status, setStatus] = useState<Extinguisher['status']>('OPERATIONAL');
  const [isLoading, setIsLoading] = useState(false);

  const isEdit = !!extinguisher;

  useEffect(() => {
    if (extinguisher) {
      setSerialNumber(extinguisher.serialNumber);
      setLocation(extinguisher.location);
      setType(extinguisher.type);
      setSize(extinguisher.size);
      // Backend returns dates as YYYY-MM-DD or full ISO, normalize to YYYY-MM-DD
      setInstallationDate(extinguisher.installationDate.split('T')[0]);
      setExpiryDate(extinguisher.expiryDate.split('T')[0]);
      setStatus(extinguisher.status);
    } else {
      // Default dates
      const today = new Date().toISOString().split('T')[0];
      const threeYearsLater = new Date();
      threeYearsLater.setFullYear(threeYearsLater.getFullYear() + 3);
      const expiry = threeYearsLater.toISOString().split('T')[0];

      setInstallationDate(today);
      setExpiryDate(expiry);
    }
  }, [extinguisher]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!serialNumber || !location || !type || !size || !installationDate || !expiryDate) {
      toast.error('Please fill in all fields.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        serialNumber,
        location,
        type,
        size,
        installationDate,
        expiryDate,
        status,
      };

      if (isEdit && extinguisher) {
        await extinguisherApi.update(extinguisher.id, payload);
        toast.success('Extinguisher updated successfully.');
      } else {
        await extinguisherApi.create(payload);
        toast.success('Extinguisher added successfully.');
      }
      onSuccess();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to save extinguisher.';
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Serial Number *
        </label>
        <Input
          placeholder="e.g. EXT-101"
          value={serialNumber}
          onChange={(e) => setSerialNumber(e.target.value)}
          required
          disabled={isLoading}
          className="bg-background border-border text-foreground rounded-md"
        />
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Location *
        </label>
        <Input
          placeholder="e.g. Ground Floor Lobby"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          required
          disabled={isLoading}
          className="bg-background border-border text-foreground rounded-md"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Type *
          </label>
          <Select
            value={type}
            onValueChange={(val: Extinguisher['type']) => setType(val)}
            disabled={isLoading}
          >
            <SelectTrigger className="bg-background border-border text-foreground rounded-md">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              {extinguisherTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t.replace('_', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Size *
          </label>
          <Select
            value={size}
            onValueChange={(val: Extinguisher['size']) => setSize(val)}
            disabled={isLoading}
          >
            <SelectTrigger className="bg-background border-border text-foreground rounded-md">
              <SelectValue placeholder="Select size" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border text-foreground">
              {extinguisherSizes.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Installation Date *
          </label>
          <Input
            type="date"
            value={installationDate}
            onChange={(e) => setInstallationDate(e.target.value)}
            required
            disabled={isLoading}
            className="bg-background border-border text-foreground rounded-md"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Expiry Date *
          </label>
          <Input
            type="date"
            value={expiryDate}
            onChange={(e) => setExpiryDate(e.target.value)}
            required
            disabled={isLoading}
            className="bg-background border-border text-foreground rounded-md"
          />
        </div>
      </div>

      {isEdit && (
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Status *
          </label>
          <Select
            value={status}
            onValueChange={(val: Extinguisher['status']) => setStatus(val)}
            disabled={isLoading}
          >
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
      )}

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
