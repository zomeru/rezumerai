import { formatDate } from "@rezumerai/utils/date";
import { capitalize } from "@rezumerai/utils/string";
import cors from "cors";
import express from "express";
import morgan from "morgan";

function createServer() {
  const app = express();

  app.use(morgan("tiny"));
  app.use(express.json({ limit: "100mb" }));

  app.use(
    cors({
      credentials: true,
      origin: ["http://localhost:3001"],
    }),
  );

  const port = process.env.PORT || 3001;

  app.get("/", (_, res) => {
    const message = capitalize("hello from express!");
    const timestamp = formatDate(new Date(), { dateStyle: "short", timeStyle: "short" });
    res.json({
      message,
      timestamp,
      server: "RezumerAI API",
    });
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

// Using this pattern to avoid SWC export bug
export { createServer };
