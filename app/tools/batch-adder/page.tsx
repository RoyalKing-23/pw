'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import "../../globals.css";

export default function BatchAdderPage() {
  const [batchId, setBatchId] = useState('');
  const [batchName, setBatchName] = useState('');
  const [batchPrice, setBatchPrice] = useState('');
  const [batchImage, setBatchImage] = useState('');
  const [template, setTemplate] = useState('NORMAL');
  const [language, setLanguage] = useState('');
  const [byName, setByName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [batchStatus, setBatchStatus] = useState(true);
  const [tokens, setTokens] = useState('');

  const handleSubmit = async () => {
    if (
      !batchId ||
      !batchName ||
      !batchPrice ||
      !batchImage ||
      !language ||
      !byName ||
      !startDate ||
      !endDate ||
      !tokens
    ) {
      toast.error('All fields are required.');
      return;
    }

    try {
      const res = await fetch('/api/admin/add-batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important: Send cookies for auth
        body: JSON.stringify({
          batchId,
          batchName,
          batchPrice: parseFloat(batchPrice),
          batchImage,
          template,
          language,
          byName,
          startDate,
          endDate,
          batchStatus,
          enrolledTokens: tokens
            .split('\n')
            .map((line) => {
              const [ownerId, accessToken, refreshToken] = line.split(':');
              if (!ownerId || !accessToken || !refreshToken) return null;
              return {
                ownerId: ownerId.trim(),
                accessToken: accessToken.trim(),
                refreshToken: refreshToken.trim(),
                tokenStatus: true,
                randomId: Math.random().toString(36).substring(7), // Generate random ID if needed
              };
            })
            .filter((t) => t !== null),
        }),
      });

      if (!res.ok) throw new Error('Failed to save batch');

      toast.success('Batch saved successfully!');
      setBatchId('');
      setBatchName('');
      setBatchPrice('');
      setBatchImage('');
      setTemplate('NORMAL');
      setLanguage('');
      setByName('');
      setStartDate('');
      setEndDate('');
      setBatchStatus(true);
      setTokens('');
    } catch (err: any) {
      toast.error('Error saving batch');
      console.error(err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 mt-10 border rounded-xl shadow-md space-y-4">
      <h1 className="text-2xl font-semibold mb-4">Add New Batch</h1>

      <Input placeholder="Batch ID" value={batchId} onChange={(e) => setBatchId(e.target.value)} />
      <Input placeholder="Batch Name" value={batchName} onChange={(e) => setBatchName(e.target.value)} />
      <Input placeholder="Batch Price" type="number" value={batchPrice} onChange={(e) => setBatchPrice(e.target.value)} />
      <Input placeholder="Batch Image URL" value={batchImage} onChange={(e) => setBatchImage(e.target.value)} />
      <Input placeholder="Template (default: NORMAL)" value={template} onChange={(e) => setTemplate(e.target.value)} />
      <Input placeholder="Language" value={language} onChange={(e) => setLanguage(e.target.value)} />
      <Input placeholder="By Name" value={byName} onChange={(e) => setByName(e.target.value)} />
      <Input type="date" placeholder="Start Date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      <Input type="date" placeholder="End Date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

      <div className="flex items-center gap-2">
        <label htmlFor="batchStatus">Batch Active?</label>
        <Switch id="batchStatus" checked={batchStatus} onCheckedChange={setBatchStatus} />
      </div>

      <Textarea
        rows={6}
        placeholder="Enter tokens: ownerId:accessToken:refreshToken, one per line"
        value={tokens}
        onChange={(e) => setTokens(e.target.value)}
      />

      <Button className="w-full" onClick={handleSubmit}>
        Save Batch
      </Button>
    </div>
  );
}
