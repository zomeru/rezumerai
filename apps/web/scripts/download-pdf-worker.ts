import { exec } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { promisify } from "node:util";

const execAsync: ReturnType<typeof promisify> = promisify(exec);

async function getPdfjsVersion(): Promise<unknown> {
  try {
    // Run the bun command
    const { stdout } = await execAsync("bun pm view react-pdf dependencies");

    // Parse the JSON output
    const deps = JSON.parse(stdout);

    // Get pdfjs-dist version
    const pdfjsVersion = deps["pdfjs-dist"];

    return pdfjsVersion;
  } catch (err) {
    console.error("\x1b[31m%s\x1b[0m", "❌ Error fetching PDF.js version:", err);
    throw err;
  }
}

async function downloadPdfWorker(): Promise<void> {
  const version = await getPdfjsVersion();

  const url = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to download PDF worker: ${res.statusText}`);
  }

  const buffer = Buffer.from(await res.arrayBuffer());

  const outputPath = resolve(process.cwd(), "public/pdf-worker/pdf.worker.min.mjs");

  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, buffer);
}

downloadPdfWorker().catch((err) => {
  console.error("\x1b[31m%s\x1b[0m", "❌ PDF worker download failed:", err);
  process.exit(1);
});
