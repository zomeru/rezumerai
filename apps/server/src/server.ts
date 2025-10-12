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
    res.send("Hello from Express!");
  });

  app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

// Using this pattern to avoid SWC export bug
export { createServer };
