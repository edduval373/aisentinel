// Image utilities for handling base64 data URLs safely in production

export function validateAndFixBase64Image(dataUrl: string): string | null {
  if (!dataUrl || typeof dataUrl !== 'string') {
    return null;
  }

  // Check if it's already a valid data URL
  if (dataUrl.startsWith('data:image/')) {
    // Extract the MIME type and base64 data
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (matches && matches[2]) {
      // Validate base64 data
      try {
        // Try to decode base64 to check if it's valid
        const base64Data = matches[2];
        // Basic validation - base64 should be valid characters and proper length
        if (base64Data.length > 20 && /^[A-Za-z0-9+/]*={0,2}$/.test(base64Data)) {
          return dataUrl;
        }
      } catch (error) {
        console.warn('Invalid base64 data in image URL:', error);
      }
    }
  }

  // If we get here, the image data is invalid
  return null;
}

export function getCompanyInitial(companyName: string): string {
  if (!companyName || typeof companyName !== 'string') {
    return 'C'; // Default fallback
  }
  return companyName.charAt(0).toUpperCase();
}

export function createFallbackImageStyle(size: number, initial: string) {
  return {
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: '#3b82f6',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: `${Math.floor(Math.min(size, 48) * 0.4)}px`,
    fontWeight: 700,
    border: '1px solid transparent'
  };
}