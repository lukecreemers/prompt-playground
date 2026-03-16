import { useRef } from 'react';
import { useStore } from '@/store';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';
import { api } from '@/lib/api';

export function CsvUploadButton() {
  const activePromptId = useStore((s) => s.activePromptId);
  const loadTestCases = useStore((s) => s.loadTestCases);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activePromptId) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as Record<string, string>[];
        for (const row of rows) {
          await api.createTestCase(activePromptId, row);
        }
        await loadTestCases();
      },
    });

    // Reset input
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        className="hidden"
      />
      <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5" onClick={() => fileRef.current?.click()}>
        <Upload className="h-3 w-3" /> CSV
      </Button>
    </>
  );
}
