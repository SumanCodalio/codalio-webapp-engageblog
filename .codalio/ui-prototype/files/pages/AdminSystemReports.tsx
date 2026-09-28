import React from "react";

export default function PagePlaceholder() {
  const handleRegenerate = () => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "codalio-regenerate-page",
          pageName: "AdminSystemReports",
          prompt: `Please regenerate the page "AdminSystemReports". The previous generation failed to produce code. Make sure to generate all sections for this page.`
        },
        "*"
      );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-16 bg-background text-foreground">
      <div className="max-w-md w-full rounded-lg border border-border bg-card p-8 text-center shadow-sm space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Page Not Generated</h1>
          <p className="text-muted-foreground text-sm">
            The page "AdminSystemReports" could not be generated. This may be due to an error during the generation process.
          </p>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-full items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          onClick={handleRegenerate}
        >
          Try Regenerating
        </button>
      </div>
    </div>
  );
}