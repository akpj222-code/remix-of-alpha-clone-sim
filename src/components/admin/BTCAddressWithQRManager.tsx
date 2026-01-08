import { useState, useRef } from 'react';
import { Plus, Minus, Upload, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface BTCAddressWithQR {
  address: string;
  qrCode?: string;
}

interface Props {
  adminSettings: { deposit_btc_addresses_with_qr?: string };
  updateAdminSetting: (key: string, value: string) => Promise<void>;
  fetchAdminSettings: () => Promise<void>;
}

export function BTCAddressWithQRManager({ adminSettings, updateAdminSetting, fetchAdminSettings }: Props) {
  const [newAddress, setNewAddress] = useState('');
  const [uploading, setUploading] = useState(false);
  const [pendingQRFile, setPendingQRFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getAddresses = (): BTCAddressWithQR[] => {
    try {
      return JSON.parse(adminSettings.deposit_btc_addresses_with_qr || '[]');
    } catch {
      return [];
    }
  };

  const handleAddAddress = async () => {
    if (!newAddress.trim()) {
      toast({ title: 'Error', description: 'Please enter a BTC address', variant: 'destructive' });
      return;
    }

    setUploading(true);
    let qrCodeUrl: string | undefined;

    // Upload QR code if provided
    if (pendingQRFile) {
      const fileExt = pendingQRFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('btc-qr-codes')
        .upload(fileName, pendingQRFile);

      if (uploadError) {
        toast({ title: 'Error', description: 'Failed to upload QR code', variant: 'destructive' });
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('btc-qr-codes')
        .getPublicUrl(fileName);

      qrCodeUrl = urlData.publicUrl;
    }

    const currentAddresses = getAddresses();
    const newEntry: BTCAddressWithQR = { address: newAddress.trim(), qrCode: qrCodeUrl };
    const updatedAddresses = [...currentAddresses, newEntry];

    await updateAdminSetting('deposit_btc_addresses_with_qr', JSON.stringify(updatedAddresses));
    
    setNewAddress('');
    setPendingQRFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    setUploading(false);
    
    await fetchAdminSettings();
  };

  const handleRemoveAddress = async (index: number) => {
    const currentAddresses = getAddresses();
    currentAddresses.splice(index, 1);
    await updateAdminSetting('deposit_btc_addresses_with_qr', JSON.stringify(currentAddresses));
    await fetchAdminSettings();
  };

  const addresses = getAddresses();

  return (
    <div className="space-y-3">
      {/* Existing addresses */}
      <div className="space-y-2">
        {addresses.map((item, idx) => (
          <div key={idx} className="flex gap-2 items-center p-2 bg-muted/50 rounded-lg">
            {item.qrCode && (
              <img src={item.qrCode} alt="QR" className="w-10 h-10 object-contain bg-white rounded" />
            )}
            <Input value={item.address} readOnly className="font-mono text-xs flex-1" />
            <Button variant="destructive" size="sm" onClick={() => handleRemoveAddress(idx)}>
              <Minus className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Add new address with optional QR */}
      <div className="space-y-2 p-3 border rounded-lg">
        <div className="flex gap-2">
          <Input
            placeholder="BTC address..."
            value={newAddress}
            onChange={(e) => setNewAddress(e.target.value)}
            className="font-mono text-sm flex-1"
          />
        </div>
        <div className="flex gap-2 items-center">
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={(e) => setPendingQRFile(e.target.files?.[0] || null)}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="gap-1"
          >
            <ImageIcon className="h-4 w-4" />
            {pendingQRFile ? pendingQRFile.name.slice(0, 15) + '...' : 'QR Code (Optional)'}
          </Button>
          <Button onClick={handleAddAddress} disabled={uploading || !newAddress.trim()} className="gap-1 ml-auto">
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
