export type Gender = 'Nam' | 'Nữ';
export type Framing = 'Chân dung' | 'Bán thân' | 'Toàn thân';
export type Background = 'Tập trung nhân vật' | 'Bối cảnh rộng và chi tiết';

export type ActiveTab = 'create' | 'analyze' | 'video';

export interface FormData {
  gender: Gender;
  framing: Framing;
  background: Background;
  theme: string;
  context: string;
  location: string;
  hairstyle: string;
  bodyShape: string;
  action: string;
  emotion: string;
  style: string;
}

export interface ImageFile {
  base64: string;
  mimeType: string;
  previewUrl: string;
  name: string; // Add file name for unique key
}

export interface GeneratedImageData {
  imageUrl: string;
  techDetails: string;
}

export interface GeneratedVideoData {
  videoUrl: string;
  techDetails: string;
}

export interface UsageStats {
  today: { images: number; videos: number; };
  month: { images: number; videos: number; };
}