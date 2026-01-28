/**
 * Barcode Validation and Utilities
 */

/**
 * Basic validation for common barcode formats
 */
export const barcodeFormats = {
    EAN13: /^[0-9]{13}$/,
    EAN8: /^[0-9]{8}$/,
    CODE128: /^[\x00-\x7F]{1,}$/,
    UPCA: /^[0-9]{12}$/,
    CODE39: /^[A-Z0-9\-\s.$/+%]{1,}$/i,
    IMEI: /^[0-9]{15}$/,
    SERIAL: /^[A-Z0-9]{6,}$/i,
};

/**
 * Validate barcode format
 */
export const isValidBarcode = (barcode: string): boolean => {
    if (!barcode || barcode.trim().length === 0) {
        return false;
    }

    // Check if barcode is at least 6 characters
    if (barcode.length < 6) {
        return false;
    }

    // Check if barcode is at most 128 characters
    if (barcode.length > 128) {
        return false;
    }

    return true;
};

/**
 * Detect barcode format
 */
export const detectBarcodeFormat = (
    barcode: string
): keyof typeof barcodeFormats | "UNKNOWN" => {
    if (barcodeFormats.EAN13.test(barcode)) return "EAN13";
    if (barcodeFormats.EAN8.test(barcode)) return "EAN8";
    if (barcodeFormats.UPCA.test(barcode)) return "UPCA";
    if (barcodeFormats.IMEI.test(barcode)) return "IMEI";
    if (barcodeFormats.CODE39.test(barcode)) return "CODE39";
    if (barcodeFormats.CODE128.test(barcode)) return "CODE128";
    if (barcodeFormats.SERIAL.test(barcode)) return "SERIAL";
    return "UNKNOWN";
};

/**
 * Validate IMEI format specifically
 */
export const isValidIMEI = (imei: string): boolean => {
    if (!imei || imei.length !== 15) {
        return false;
    }
    if (!/^\d+$/.test(imei)) {
        return false;
    }
    return luhnCheck(imei);
};

/**
 * Luhn algorithm for IMEI validation
 */
const luhnCheck = (value: string): boolean => {
    let sum = 0;
    let isEven = false;

    for (let i = value.length - 1; i >= 0; i--) {
        let digit = parseInt(value[i], 10);

        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }

        sum += digit;
        isEven = !isEven;
    }

    return sum % 10 === 0;
};

/**
 * Format barcode for display
 */
export const formatBarcodeDisplay = (barcode: string): string => {
    if (!barcode) return "";

    // For IMEI, format as 15 digits with hyphens
    if (barcode.length === 15) {
        return `${barcode.slice(0, 4)}-${barcode.slice(4, 8)}-${barcode.slice(
            8,
            12
        )}-${barcode.slice(12)}`;
    }

    return barcode;
};

/**
 * Clean barcode (remove whitespace, special chars)
 */
export const cleanBarcode = (barcode: string): string => {
    return barcode.trim().replace(/[\s\-]/g, "");
};

/**
 * Extract barcode from string (handles common formats)
 */
export const extractBarcode = (text: string): string | null => {
    const cleaned = cleanBarcode(text);

    if (isValidBarcode(cleaned)) {
        return cleaned;
    }

    return null;
};

/**
 * Generate checksum for barcode (EAN13)
 */
export const calculateEAN13Checksum = (code: string): string => {
    const digits = code.slice(0, 12);
    let sum = 0;

    for (let i = 0; i < 12; i++) {
        sum += parseInt(digits[i], 10) * (i % 2 === 0 ? 1 : 3);
    }

    const checksum = (10 - (sum % 10)) % 10;
    return digits + checksum;
};

/**
 * Mock barcode check (for development without camera)
 */
export const basicBarcodeCheck = (barcode: string): boolean => {
    return isValidBarcode(barcode);
};
