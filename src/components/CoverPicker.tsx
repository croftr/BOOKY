'use client';

import { Upload } from 'lucide-react';

interface CoverPickerProps {
  onUploadFile: (file: File) => void;
  currentPreview?: string;
}

export default function CoverPicker({ onUploadFile, currentPreview }: CoverPickerProps) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadFile(file);
    }
  };

  return (
    <div className="space-y-4">
      <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors cursor-pointer">
        <Upload size={18} />
        Upload Image
        <input
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />
      </label>

      {currentPreview && (
        <div className="mt-4">
          <div className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Current Cover:</div>
          <img
            src={currentPreview}
            alt="Current cover"
            className="w-32 h-48 object-cover rounded shadow-md"
          />
        </div>
      )}
    </div>
  );
}
