import React, { useCallback } from 'react';
import { Upload } from 'lucide-react';

interface FileUploadProps {
  onFileLoaded: (buffer: ArrayBuffer, fileName: string) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileLoaded }) => {
  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          onFileLoaded(e.target.result as ArrayBuffer, file.name);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [onFileLoaded]);

  return (
    <div className="flex flex-col items-center justify-center h-[50vh] border-2 border-dashed border-gray-700 rounded-xl bg-gray-900/50 hover:bg-gray-900/80 transition-colors">
      <div className="text-center p-8">
        <div className="bg-gray-800 p-4 rounded-full inline-flex mb-4">
          <Upload className="w-8 h-8 text-blue-400" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Import Font File</h3>
        <p className="text-gray-400 mb-6">Supports .otf and .ttf formats</p>
        
        <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-6 rounded-lg transition-colors">
          <span>Select File</span>
          <input 
            type="file" 
            accept=".otf,.ttf" 
            className="hidden" 
            onChange={handleFileChange}
          />
        </label>
      </div>
    </div>
  );
};