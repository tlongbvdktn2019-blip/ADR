// =====================================================
// QR CODE SERVICE FOR GOOGLE DRIVE LINKS
// Service để tạo QR code chứa link Google Drive
// =====================================================

import QRCode from 'qrcode';

export class QRDriveService {
  /**
   * Tạo QR code từ Google Drive URL
   * @param driveUrl - Link Google Drive của file thẻ dị ứng
   * @returns Data URL của QR code (base64)
   */
  static async generateQRFromDriveUrl(driveUrl: string): Promise<string> {
    try {
      // Validate URL
      if (!driveUrl || !this.isValidDriveUrl(driveUrl)) {
        throw new Error('Invalid Google Drive URL');
      }

      // Generate QR code
      const qrCodeDataUrl = await QRCode.toDataURL(driveUrl, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      });

      return qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      throw new Error('Không thể tạo mã QR');
    }
  }

  /**
   * Kiểm tra URL có phải là Google Drive link hợp lệ không
   */
  static isValidDriveUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url);
      
      // Check if it's a Google Drive URL
      return (
        parsedUrl.hostname === 'drive.google.com' ||
        parsedUrl.hostname === 'docs.google.com'
      );
    } catch {
      return false;
    }
  }

  /**
   * Chuyển đổi Google Drive share link sang direct view link
   * Từ: https://drive.google.com/file/d/FILE_ID/view?usp=sharing
   * Sang: https://drive.google.com/file/d/FILE_ID/view
   */
  static normalizeDriveUrl(url: string): string {
    try {
      const parsedUrl = new URL(url);
      
      // Remove query parameters for cleaner QR
      parsedUrl.search = '';
      
      return parsedUrl.toString();
    } catch {
      return url;
    }
  }

  /**
   * Extract file ID từ Google Drive URL
   */
  static extractFileId(url: string): string | null {
    try {
      // Pattern 1: /file/d/FILE_ID/
      const pattern1 = /\/file\/d\/([^/]+)/;
      const match1 = url.match(pattern1);
      if (match1) return match1[1];

      // Pattern 2: /folders/FOLDER_ID
      const pattern2 = /\/folders\/([^/]+)/;
      const match2 = url.match(pattern2);
      if (match2) return match2[1];

      // Pattern 3: id=FILE_ID
      const pattern3 = /[?&]id=([^&]+)/;
      const match3 = url.match(pattern3);
      if (match3) return match3[1];

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Tạo direct download link (nếu cần)
   */
  static createDirectLink(fileId: string): string {
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }

  /**
   * Tạo preview link
   */
  static createPreviewLink(fileId: string): string {
    return `https://drive.google.com/file/d/${fileId}/view`;
  }
}


