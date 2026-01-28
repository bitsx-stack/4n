import React, { useState, useEffect, useRef } from 'react';

interface BarcodeScannerProps {
  onScan: (barcode: string) => void;
  minLength?: number;
  timeout?: number;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ 
  onScan, 
  minLength = 5, 
  timeout = 100 
}) => {
  const [buffer, setBuffer] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      // Prevent default behavior for barcode scanner input
      if (event.key === 'Enter') {
        event.preventDefault();
        
        // Clear the timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Process the buffered barcode
        if (buffer.length >= minLength) {
          onScan(buffer);
          setBuffer('');
        }
        return;
      }

      // Only accept alphanumeric characters and some special chars
      if (/^[a-zA-Z0-9]$/.test(event.key)) {
        event.preventDefault();
        
        // Clear previous timeout
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Add character to buffer
        setBuffer(prev => prev + event.key);

        // Set timeout to auto-submit if Enter is not pressed
        timeoutRef.current = setTimeout(() => {
          if (buffer.length + 1 >= minLength) {
            onScan(buffer + event.key);
          }
          setBuffer('');
        }, timeout);
      }
    };

    // Add event listener
    window.addEventListener('keypress', handleKeyPress);

    // Cleanup
    return () => {
      window.removeEventListener('keypress', handleKeyPress);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [buffer, minLength, timeout, onScan]);

  return null; // This is a headless component
};

export default BarcodeScanner;