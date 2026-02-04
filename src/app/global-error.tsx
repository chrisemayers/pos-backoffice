"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global error:", error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md rounded-lg border bg-white p-8 shadow-lg">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h1 className="mb-2 text-center text-xl font-semibold">
              Application Error
            </h1>
            <p className="mb-6 text-center text-gray-600">
              A critical error occurred. Please try refreshing the page.
            </p>
            {process.env.NODE_ENV === "development" && (
              <div className="mb-4 rounded-lg bg-gray-100 p-3 text-sm">
                <p className="font-medium">Error:</p>
                <p className="mt-1 font-mono text-xs text-gray-700">
                  {error.message}
                </p>
              </div>
            )}
            <button
              onClick={reset}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
