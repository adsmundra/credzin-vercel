import React from "react";
import CircularProgress from "@mui/material/CircularProgress";

const LoadingOverlay = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90">
      <div className="flex flex-col items-center gap-4">
        <CircularProgress size={48} thickness={4} style={{ color: "#0c7ff2" }} />
        <p className="text-white text-lg font-medium">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
