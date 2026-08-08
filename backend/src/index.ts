import { createApp } from "./app.js";
import { config } from "./config.js";
import { closeDb } from "./db/index.js";

const server = createApp().listen(config.port, () => {
  console.log(`One Place for Startups API listening on http://localhost:${config.port}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    server.close(() => {
      void closeDb().finally(() => process.exit(0));
    });
  });
}
