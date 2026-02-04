"use client";

import { useEffect } from "react";
import { PageError } from "@/components/page-error";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Page error:", error);
  }, [error]);

  return (
    <PageError
      title="Page Error"
      description="Something went wrong loading this page."
      error={error}
      reset={reset}
    />
  );
}
