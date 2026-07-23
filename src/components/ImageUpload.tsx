import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon } from 'lucide-react';

interface ImageUploadProps {
  onImageSelected: (base64: string, mimeType: string, objectUrl: string) => void;
  disabled?: boolean;
}

export function ImageUpload({ onImageSelected, disabled }: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;

    const objectUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    
    reader.onloadend = () => {
      const result = reader.result as string;
      // result is "data:image/jpeg;base64,....."
      const base64Data = result.split(',')[1];
      onImageSelected(base64Data, file.type, objectUrl);
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, [disabled]);

  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
      className={`relative w-full max-w-lg mx-auto flex flex-col items-center justify-center px-6 py-12 border-2 border-dashed rounded-xl transition-colors cursor-pointer
        ${disabled ? 'opacity-50 cursor-not-allowed border-gray-300 bg-gray-50' : 
          isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'}
      `}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFile(e.target.files[0]);
          }
        }}
        disabled={disabled}
      />
      <div className="flex flex-col items-center space-y-4 text-center">
        <div className="p-4 bg-white shadow-sm rounded-full">
          <UploadCloud className="w-8 h-8 text-indigo-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900">
            Click or drag an image here
          </p>
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG up to 10MB
          </p>
        </div>
      </div>
    </div>
  );
}
