const mongoose = require("mongoose");
const { mongoUri } = require("./env");

async function connectDatabase() {
  await mongoose.connect(mongoUri);
  console.log("MongoDB connected");
}

function isDatabaseReady() {
  return mongoose.connection.readyState === 1;
}

module.exports = { connectDatabase, isDatabaseReady };
