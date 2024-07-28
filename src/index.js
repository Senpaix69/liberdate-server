import { configureSocket } from "./socket/socket_client.js";
import connectDB from "./clients/mongo_client.js";
import server from "./server.js";
import dotenv from "dotenv";

dotenv.config();

connectDB()
  .then(() => {
    configureSocket(server);
    server.listen(process.env.PORT || 3000, "0.0.0.0", () => {
      console.log(`Server is running at post : ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MONGODB connection failed! ", error);
  });
