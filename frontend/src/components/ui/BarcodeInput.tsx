import React, { useState } from 'react';

const BarcodeInput: React.FC = () => {
  const [barcode, setBarcode] = useState<string>('');
  const [scannedCodes, setScannedCodes] = useState<string[]>([]);

  const handleBarcodeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBarcode(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (barcode.trim()) {
        setScannedCodes(prev => [barcode, ...prev]);
        setBarcode(''); // Clear input after scan
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Scan Barcode</h1>
      
      <input
        type="text"
        value={barcode}
        onChange={handleBarcodeInput}
        onKeyPress={handleKeyPress}
        placeholder="Focus here and scan barcode"
        autoFocus
        style={{
          padding: '10px',
          fontSize: '18px',
          width: '300px'
        }}
      />

      <div style={{ marginTop: '20px' }}>
        <h2>Scanned Codes:</h2>
        <ul>
          {scannedCodes.map((code, index) => (
            <li key={index}>{code}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default BarcodeInput;