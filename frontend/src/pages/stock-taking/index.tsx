
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import AdminDashboardLayout from 'src/components/AdminDashboardLayout';
import BarcodeScanner from 'src/components/BarcodeScanner';
import DashboardCard from 'src/components/DashboardCard';
import api from 'src/utils/api';


const StockTakingPage: React.FC = () => {
  type OptionType = { value: string | number; label: string };

  const [stores, setStores] = useState<OptionType[]>([]);
  const [brands, setBrands] = useState<OptionType[]>([]);
  const [models, setModels] = useState<OptionType[]>([]);
  const [storages, setStorages] = useState<OptionType[]>([]);
  const [selectedStore, setSelectedStore] = useState<OptionType | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<OptionType | null>(null);
  const [selectedModel, setSelectedModel] = useState<OptionType | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<OptionType | null>(null);
  const [barcode, setBarcode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch stores
  useEffect(() => {
    api.get('/stores').then(res => {
      setStores((res.data || []).map((s: any) => ({ value: s.id, label: s.name })));
    });
  }, []);

  // Fetch brands (from imeis)
  useEffect(() => {
    api.get('/imeis').then(res => {
      const all = res.data.data || [];
      const uniqueBrands = Array.from(new Set(all.map((i: any) => i.brand))).filter(Boolean);
      setBrands(uniqueBrands.map(b => ({ value: String(b), label: String(b) })));
    });
  }, []);

  // Fetch models when brand changes
  useEffect(() => {
    if (!selectedBrand) { setModels([]); return; }
    api.get('/imeis').then(res => {
      const all = res.data.data || [];
      const filtered = all.filter((i: any) => i.brand === selectedBrand.value);
      const uniqueModels = Array.from(new Set(filtered.map((i: any) => i.model))).filter(Boolean);
      setModels((uniqueModels as string[]).map(m => ({ value: m, label: m })));
    });
  }, [selectedBrand]);

  // Fetch storage options
  useEffect(() => {
    api.get('/imeis/storage-options').then(res => {
      setStorages((res.data || []).map((s: any) => ({ value: s.name, label: s.name })));
    });
  }, []);

  // Handle barcode scan
  const handleScan = (scanned: string) => {
    setBarcode(scanned);
    setMessage('');
  };

  // Submit to DB
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');
    try {
      await api.post('/imeis', {
        code: barcode,
        brand: selectedBrand?.value,
        model: selectedModel?.value,
        storage_size: selectedStorage?.value,
        store_id: selectedStore?.value,
      });
      setMessage('Stock entry submitted!');
      setBarcode('');
    } catch (err: any) {
      setMessage(err?.response?.data?.detail || 'Error submitting stock entry');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AdminDashboardLayout>
      <DashboardCard title="Stock Taking">
        <form onSubmit={handleSubmit} className="tw-space-y-4">
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
            <Select options={stores} value={selectedStore} onChange={setSelectedStore} placeholder="Select Store" />
            <Select options={brands} value={selectedBrand} onChange={setSelectedBrand} placeholder="Select Brand" />
            <Select options={models} value={selectedModel} onChange={setSelectedModel} placeholder="Select Model" isDisabled={!selectedBrand} />
            <Select options={storages} value={selectedStorage} onChange={setSelectedStorage} placeholder="Select Storage" />
          </div>
          <div>
            <BarcodeScanner onScan={handleScan} minLength={5} timeout={100} />
            <input
              type="text"
              value={barcode}
              onChange={e => setBarcode(e.target.value)}
              placeholder="Scan or enter barcode"
              className="tw-px-4 tw-py-2 tw-border tw-rounded-lg tw-w-full tw-mt-2"
              required
            />
          </div>
          <button
            type="submit"
            className="tw-bg-primary tw-text-white tw-px-6 tw-py-2 tw-rounded-lg"
            disabled={submitting || !barcode || !selectedStore || !selectedBrand || !selectedModel || !selectedStorage}
          >
            {submitting ? 'Submitting...' : 'Submit Stock Entry'}
          </button>
          {message && <div className="tw-mt-2 tw-text-center tw-text-primary">{message}</div>}
        </form>
      </DashboardCard>
    </AdminDashboardLayout>
  );
};

export default StockTakingPage;