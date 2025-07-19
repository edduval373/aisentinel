
export class FileStorageService {
  constructor() {
    // Always available since we store files directly in the database
  }

  async processFile(file: Buffer, fileName: string, mimeType: string): Promise<string> {
    // Process file content similar to context documents
    let content = '';
    
    if (mimeType.startsWith('text/') || mimeType === 'application/json') {
      // For text files, store the full content
      content = file.toString('utf-8');
    } else if (mimeType.startsWith('image/')) {
      // For images, store as base64
      content = `data:${mimeType};base64,${file.toString('base64')}`;
    } else {
      // For other files, store as base64 with metadata
      content = `data:${mimeType};base64,${file.toString('base64')}`;
    }
    
    return content;
  }

  async getFileContent(content: string, mimeType: string): Promise<Buffer> {
    if (content.startsWith('data:')) {
      // Extract base64 content from data URL
      const base64Data = content.split(',')[1];
      return Buffer.from(base64Data, 'base64');
    } else {
      // For text content, convert to buffer
      return Buffer.from(content, 'utf-8');
    }
  }

  isAvailable(): boolean {
    return true; // Always available since we use database storage
  }

  async getFileUrl(attachmentId: number): Promise<string> {
    // Create download endpoint using attachment ID
    return `/api/files/download/${attachmentId}`;
  }

  generateFileName(originalName: string, messageId: number): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_');
    return `${messageId}_${timestamp}_${baseName}.${extension}`;
  }
}

export const fileStorageService = new FileStorageService();
