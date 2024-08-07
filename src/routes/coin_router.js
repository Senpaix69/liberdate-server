import { Router } from "express";
import {
  deleteAllCoins,
  getAllCoins,
  deleteCoin,
  updateCoin,
  addCoin,
  getCoin,
} from "../controllers/coin_controller.js";
const coinRouter = Router();

coinRouter
  .post("/add", addCoin)
  .post("/update", updateCoin)
  .get("/get_all", getAllCoins)
  .get("/get/:coinId", getCoin)
  .get("/delete_all/", deleteAllCoins)
  .get("/delete/:coinId", deleteCoin);

export default coinRouter;
