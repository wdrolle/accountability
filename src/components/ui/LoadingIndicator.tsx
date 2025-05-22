import { CircularProgress } from "@mui/material";

export function LoadingIndicator() {
  return (
    <div className="flex items-center justify-center p-4">
      <CircularProgress size={24} />
      <span className="ml-2">Thinking...</span>
    </div>
  );
} 