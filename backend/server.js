const app = require("./src/app");
const { connectDatabase } = require("./src/config/database");
const { port, isProduction } = require("./src/config/env");
const { startExpirationWorker } = require("./src/jobs/expirationWorker");
const { ensureAdminAccount } = require("./src/services/admin/ensureAdminAccount");

app.listen(port, () => console.log(`KGS API listening on ${port}`));
connectDatabase()
  .then(async () => {
    console.log("MongoDB connected");
    if (!isProduction) await ensureAdminAccount();
    startExpirationWorker();
  })
  .catch((error) => console.error("MongoDB connection failed:", error.message));
