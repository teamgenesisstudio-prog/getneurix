import { useState, useCallback } from "react";
import { Upload, FileText, X } from "lucide-react";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

const FileUpload = ({ onFileSelect, isProcessing }: FileUploadProps) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) { setSelectedFile(file); onFileSelect(file); }
  }, [onFileSelect]);

  const handleSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setSelectedFile(file); onFileSelect(file); }
  }, [onFileSelect]);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
        dragOver ? "neon-border-cyan bg-primary/5" : "border-border hover:border-primary/40"
      } ${isProcessing ? "opacity-50 pointer-events-none" : ""}`}
    >
      <input
        type="file"
        accept=".csv,.json,.pkl"
        onChange={handleSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      {selectedFile ? (
        <div className="flex items-center justify-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <span className="font-mono text-sm text-foreground">{selectedFile.name}</span>
          <button onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>
            <X className="w-4 h-4 text-muted-foreground hover:text-destructive" />
          </button>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          <Upload className="w-8 h-8 text-primary animate-pulse-neon" />
          <p className="font-mono text-sm text-muted-foreground">
            DROP MODEL FILE — CSV, JSON, PKL
          </p>
          <p className="text-xs text-muted-foreground/60">or click to browse</p>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
