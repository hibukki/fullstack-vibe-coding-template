import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { Download, FileIcon, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { api } from "../../convex/_generated/api";

const userFilesQueryOptions = convexQuery(api.userFiles.getCurrentUserFiles, {});

export const Route = createFileRoute("/files")({
  loader: async ({ context: { queryClient } }) => {
    if ((window as any).Clerk?.session) {
      await queryClient.ensureQueryData(userFilesQueryOptions);
    }
  },
  component: FilesPage,
});

function FilesPage() {
  const { data: files } = useSuspenseQuery(userFilesQueryOptions);
  const generateUploadUrl = useMutation(api.userFiles.generateUploadUrl);
  const saveFileMetadata = useMutation(api.userFiles.saveFileMetadata);
  const deleteFile = useMutation(api.userFiles.deleteFile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Step 1: Generate upload URL
      const uploadUrl = await generateUploadUrl();

      // Step 2: Upload file to Convex storage
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });

      const { storageId } = await result.json();

      // Step 3: Save file metadata
      await saveFileMetadata({
        fileId: storageId,
        fileName: file.name,
      });

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (fileMetadataId: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;

    try {
      await deleteFile({ fileMetadataId: fileMetadataId as any });
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete file. Please try again.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1>My Files</h1>

      <div className="not-prose mb-6">
        <label className="btn btn-primary">
          <Upload className="w-4 h-4 mr-2" />
          {isUploading ? "Uploading..." : "Upload File"}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
      </div>

      {files.length === 0 ? (
        <div className="not-prose">
          <div className="p-8 bg-base-200 rounded-lg text-center">
            <FileIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="opacity-70">No files yet. Upload your first file!</p>
          </div>
        </div>
      ) : (
        <div className="not-prose">
          <div className="list">
            {files.map((file) => (
              <div
                key={file._id}
                className="list-row flex items-center justify-between p-4 bg-base-200 rounded-lg mb-2"
              >
                <div className="flex items-center gap-3">
                  <FileIcon className="w-5 h-5 text-primary" />
                  <div>
                    <div className="font-medium">{file.fileName}</div>
                    <div className="text-sm opacity-70">
                      Uploaded {new Date(file._creationTime).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  {file.url && (
                    <a
                      href={file.url}
                      download={file.fileName}
                      className="btn btn-sm btn-ghost"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => handleDelete(file._id)}
                    className="btn btn-sm btn-ghost text-error"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
