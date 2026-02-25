async function getPdfjsVersion(): Promise<string> {
  const proc = Bun.spawn(["bun", "pm", "view", "react-pdf", "dependencies"], {
    stdout: "pipe",
  });

  const stdout = await new Response(proc.stdout).text();
  const deps = JSON.parse(stdout);

  return deps["pdfjs-dist"];
}

async function downloadPdfWorker(): Promise<void> {
  const version = await getPdfjsVersion();
  console.log(`📥 Downloading PDF worker for pdfjs-dist@${version}...`);

  const res = await fetch(
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`,
  );

  if (!res.ok) {
    throw new Error(`Failed to download PDF worker: ${res.statusText}`);
  }

  console.log(
    "💾 Saving PDF worker to public/pdf-worker/pdf.worker.min.mjs...",
  );
  await Bun.write(
    new URL("../public/pdf-worker/pdf.worker.min.mjs", import.meta.url),
    res,
  );
}

downloadPdfWorker().catch((err) => {
  console.error("❌ PDF worker download failed:", err);
  process.exit(1);
});
