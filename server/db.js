import mongoose from "mongoose";

export async function connectDB() {
  const url = process.env.MONGO_URL;
  if (!url) throw new Error("MONGO_URL is not set");
  mongoose.set("strictQuery", true);
  await mongoose.connect(url, { autoIndex: true });
  console.log("MongoDB connected");
}
