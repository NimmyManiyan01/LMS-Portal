const mongoose = require("mongoose");
const { mongoUri, isProduction } = require("./env");

mongoose.set("strictQuery", true);
mongoose.set("sanitizeFilter", true);

async function connectDatabase() {
  await mongoose.connect(mongoUri, {
    autoIndex: !isProduction,
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 1,
  });
  console.log("MongoDB connected");
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDatabase, isDatabaseReady };
