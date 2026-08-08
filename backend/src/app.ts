import cors from "cors";
import express from "express";

import { config } from "./config.js";
import { errorHandler, notFoundHandler } from "./http/errors.js";
import { cofounderRouter } from "./routes/cofounder.js";
import { ideaRouter } from "./routes/idea.js";
import { investorRouter } from "./routes/investor.js";
import { marketRouter } from "./routes/market.js";
import { profileRouter } from "./routes/profile.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: "*",
      allowedHeaders: "*",
    }),
  );
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.use("/profile", profileRouter);
  app.use("/idea", ideaRouter);
  app.use("/market", marketRouter);
  app.use("/cofounder", cofounderRouter);
  app.use("/investor", investorRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
