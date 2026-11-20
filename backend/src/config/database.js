const mongoose = require("mongoose");
const { mongoUri, isProduction } = require("./env");

mongoose.set("strictQuery", true);

async function connectDatabase() {
  try {
    await mongoose.connect(mongoUri, {
      autoIndex: !isProduction,
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 8000,
      maxPoolSize: 10,
      minPoolSize: 1,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection warning:", error.message);
  }
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDatabase, isDatabaseReady };
