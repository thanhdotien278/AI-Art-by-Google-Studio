import React, { useRef, useState } from 'react';
import { ImageFile } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ImageUploadProps {
  imageFile: ImageFile | null;
  setImageFile: (file: ImageFile | null) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ imageFile, setImageFile }) => {
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useLanguage();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError(t('errorNotImage'));
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setImageFile({
            base64: base64String,
            mimeType: file.type,
            previewUrl: URL.createObjectURL(file),
            name: file.name
        });
        setError(null);
      };
      reader.onerror = () => {
        setError(t('errorFileRead'));
      }
      reader.readAsDataURL(file);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemoveImage = () => {
      if (imageFile) {
        URL.revokeObjectURL(imageFile.previewUrl);
      }
      setImageFile(null);
      if(fileInputRef.current) {
          fileInputRef.current.value = '';
      }
  }

  return (
    <div>
      <div 
        className="group relative flex justify-center items-center px-6 pt-5 pb-6 border-2 border-stone-700 border-dashed rounded-xl cursor-pointer hover:border-cyan-500 transition-colors duration-300 min-h-[160px] bg-stone-900/30 hover:bg-stone-800/40"
        onClick={handleUploadClick}
      >
        <div className="absolute inset-0 rounded-lg border-cyan-500 opacity-0 group-hover:opacity-30 transition-opacity duration-300" style={{boxShadow: '0 0 15px 3px var(--tw-shadow-color)'}}></div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
          // Use a unique key based on the file name to force re-render on file change,
          // which helps in scenarios like uploading the same file after removing it.
          key={imageFile?.name || 'file-input'}
        />
        {imageFile ? (
            <div className="relative text-center group">
                <img src={imageFile.previewUrl} alt="Preview" className="h-28 w-28 rounded-lg object-cover mx-auto shadow-md" />
                <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-xs text-white font-semibold">{t('changeImagePrompt')}</p>
                </div>
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                    }}
                    className="absolute top-0 right-0 -m-2 bg-red-600 text-white rounded-full p-1 shadow-lg transform group-hover:scale-100 scale-0 transition-transform duration-200"
                    aria-label="Remove image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>
        ) : (
            <div className="space-y-1 text-center">
            <svg
                className="mx-auto h-12 w-12 text-stone-600 group-hover:text-cyan-500 transition-colors"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
            >
                <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                />
            </svg>
            <p className="text-sm text-stone-500 group-hover:text-cyan-400 transition-colors font-semibold">{t('uploadPrompt')}</p>
            <p className="text-xs text-stone-600">{t('uploadPromptSubtext')}</p>
            </div>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};