const mongoose = require("mongoose");
const { mongoUri, isProduction } = require("./env");

mongoose.set("strictQuery", true);

async function connectDatabase() {
  try {
    const maxPoolSize = Math.max(50, Number(process.env.MONGO_MAX_POOL_SIZE || 100));
    const minPoolSize = Math.max(5, Number(process.env.MONGO_MIN_POOL_SIZE || 10));

    await mongoose.connect(mongoUri, {
      autoIndex: !isProduction,
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize,
      minPoolSize,
    });
    console.log(`MongoDB connected (Pool: ${minPoolSize}-${maxPoolSize})`);
  } catch (error) {
    console.error("MongoDB connection warning:", error.message);
  }
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDatabase, isDatabaseReady };
