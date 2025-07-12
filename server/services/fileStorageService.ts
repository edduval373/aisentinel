
import { Client } from '@replit/object-storage';

export class FileStorageService {
  private client: Client | null = null;
  private isInitialized = false;

  constructor() {
    try {
      this.client = new Client();
      this.isInitialized = true;
    } catch (error) {
      console.warn('Object storage not properly configured, file uploads will be disabled:', error.message);
      this.client = null;
      this.isInitialized = false;
    }
  }

  private checkInitialized(): void {
    if (!this.isInitialized || !this.client) {
      throw new Error('File storage service is not properly configured');
    }
  }

  async uploadFile(file: Buffer, fileName: string, path: string): Promise<string> {
    this.checkInitialized();
    const fullPath = `chat-attachments/${path}/${fileName}`;
    await this.client!.uploadFromBytes(fullPath, file);
    return fullPath;
  }

  async downloadFile(path: string): Promise<Buffer> {
    this.checkInitialized();
    return await this.client!.downloadAsBytes(path);
  }

  async deleteFile(path: string): Promise<void> {
    this.checkInitialized();
    await this.client!.delete(path);
  }

  isAvailable(): boolean {
    return this.isInitialized && this.client !== null;
  }

  async getFileUrl(path: string): Promise<string> {
    // For Replit Object Storage, we'll create a download endpoint
    return `/api/files/download/${encodeURIComponent(path)}`;
  }

  generateFileName(originalName: string, messageId: number): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const baseName = originalName.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9]/g, '_');
    return `${messageId}_${timestamp}_${baseName}.${extension}`;
  }
}

export const fileStorageService = new FileStorageService();
