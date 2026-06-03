import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FileDown, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ExportButtonsProps {
  onExport: (format: 'csv' | 'pdf') => Promise<any>;
  reportName: string;
}

export default function ExportButtons({ onExport, reportName }: ExportButtonsProps) {
  const [isCsvLoading, setIsCsvLoading] = useState(false);
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (format === 'csv') {
      setIsCsvLoading(true);
    } else {
      setIsPdfLoading(true);
    }

    try {
      const data = await onExport(format);
      
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${reportName}_report.${format === 'csv' ? 'csv' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`${format.toUpperCase()} report downloaded successfully.`);
    } catch (err) {
      toast.error(`Failed to download ${format.toUpperCase()} report.`);
    } finally {
      if (format === 'csv') {
        setIsCsvLoading(false);
      } else {
        setIsPdfLoading(false);
      }
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={isCsvLoading || isPdfLoading}
        onClick={() => handleExport('csv')}
        className="border-border text-foreground hover:bg-muted flex items-center gap-1.5 rounded-md"
      >
        <FileDown className="h-4 w-4" />
        {isCsvLoading ? 'Exporting...' : 'Export CSV'}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={isCsvLoading || isPdfLoading}
        onClick={() => handleExport('pdf')}
        className="border-border text-foreground hover:bg-muted flex items-center gap-1.5 rounded-md"
      >
        <FileText className="h-4 w-4" />
        {isPdfLoading ? 'Exporting...' : 'Export PDF'}
      </Button>
    </div>
  );
}
