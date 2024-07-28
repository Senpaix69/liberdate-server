import { DB_NAME } from "../constants.js";
import mongoose from "mongoose";

let retries = 3;
let retryDuration = 2000;

const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URI}/${DB_NAME}`
    );
    console.log(
      `\nMongoDB connected !! DB HOST: ${connectionInstance.connection.host}`
    );
  } catch (error) {
    console.log("MONGODB connection error: ", error.message);
    if (--retries === 0) {
      console.log("No more retries left, exiting...");
      process.exit(1);
    }
    console.log(`Reconnecting in ${retryDuration / 1000} seconds...`);
    retryDuration *= 2;
    setTimeout(connectDB, retryDuration);
  }
};

export default connectDB;

// ngrok http --domain=actively-welcome-haddock.ngrok-free.app 3000
