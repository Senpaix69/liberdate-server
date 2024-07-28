import { Router } from "express";
import {
  addLocation,
  deleteLocation,
  getAllLocations,
  getLocation,
  updateLocation,
  deleteAllLocations,
} from "../controllers/location_controller.js";
const LocationRouter = Router();

LocationRouter.post("/add", addLocation)
  .post("/update", updateLocation)
  .post("/get_all", getAllLocations)
  .get("/get/:locationId", getLocation)
  .post("/delete_all", deleteAllLocations)
  .get("/delete/:locationId", deleteLocation);

export default LocationRouter;
