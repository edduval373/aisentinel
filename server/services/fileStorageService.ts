
import { Client } from '@replit/object-storage';

export class FileStorageService {
  private client: Client;

  constructor() {
    this.client = new Client();
  }

  async uploadFile(file: Buffer, fileName: string, path: string): Promise<string> {
    const fullPath = `chat-attachments/${path}/${fileName}`;
    await this.client.uploadFromBytes(fullPath, file);
    return fullPath;
  }

  async downloadFile(path: string): Promise<Buffer> {
    return await this.client.downloadAsBytes(path);
  }

  async deleteFile(path: string): Promise<void> {
    await this.client.delete(path);
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
