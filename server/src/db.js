const mongoose = require('mongoose');

const connectDb = async () => {
  const uri = process.env.MONGO_URI;
  console.log(uri)
  if (!uri) {
    throw new Error('MONGO_URI is required');
  }
  await mongoose.connect(uri);
};

module.exports = { connectDb };
