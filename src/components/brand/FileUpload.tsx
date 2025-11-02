import React, { useRef, useState } from 'react';
import type { FileData } from '@/types';
import { filesToBase64 } from '@/utils/fileUtils';

interface FileUploadProps {
  label: string;
  accept: string;
  multiple?: boolean;
  files: FileData[];
  onChange: (files: FileData[]) => void;
  placeholder?: string;
}

export function FileUpload({ label, accept, multiple = false, files, onChange, placeholder }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const newFiles = await filesToBase64(selectedFiles);
    onChange([...files, ...newFiles]);
    
    // Reset input so same file can be uploaded again if needed
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length === 0) return;

    const newFiles = await filesToBase64(droppedFiles);
    onChange([...files, ...newFiles]);
  };

  const removeFile = (index: number) => {
    onChange(files.filter((_, i) => i !== index));
  };

  return (
    <div>
      <label className="block text-sm font-bold text-gray-700 mb-2">
        {label}
      </label>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileChange}
        className="w-full p-2 border border-gray-300 rounded-lg text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
      />
      <div 
        className={`mt-2 flex flex-wrap gap-2 min-h-[80px] p-2 rounded-lg border-2 transition-all ${
          isDragging 
            ? 'border-brand-500 bg-brand-50 border-dashed' 
            : 'border-gray-200 bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="w-full h-full flex items-center justify-center text-brand-600 font-semibold">
            📁 Drop files here
          </div>
        )}
        {!isDragging && files.length === 0 && (
          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
            {/* Empty - no placeholder text */}
          </div>
        )}
        {!isDragging && files.length > 0 && (
          files.map((file, index) => {
            // Use a stable key based on file data to prevent flickering
            const fileKey = `${file.name || 'file'}-${index}-${file.data.substring(0, 20)}`;
            const isPdfFile = file.mimeType === 'application/pdf';
            
            return (
              <div key={fileKey} className="relative group">
                {isPdfFile ? (
                  <div className="image-preview-item flex flex-col items-center justify-center bg-brand-50 text-brand-700 p-2 text-xs font-semibold border border-brand-200">
                    <div className="text-2xl mb-1">📄</div>
                    <div className="text-center">PDF</div>
                    {file.name && (
                      <div className="text-[10px] text-gray-600 truncate w-full text-center mt-1">
                        {file.name.substring(0, 12)}
                      </div>
                    )}
                  </div>
                ) : (
                  <img
                    src={`data:${file.mimeType};base64,${file.data}`}
                    alt={file.name || `File ${index + 1}`}
                    className="image-preview-item"
                    loading="lazy"
                    onError={(e) => {
                      // Handle broken images
                      const target = e.target as HTMLImageElement;
                      target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><rect fill="%23f3f4f6" width="96" height="96"/><text x="50%" y="50%" font-size="12" fill="%239ca3af" text-anchor="middle" dy=".3em">Error</text></svg>';
                    }}
                  />
                )}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  ✕
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}


