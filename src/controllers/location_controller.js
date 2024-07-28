import Location from "../models/location_model.js";

export const addLocation = async (req, res) => {
  try {
    const { userId, location } = req.body;

    const newLocation = await Location.create({
      userId,
      ...location,
    });

    if (!newLocation) {
      return res.status(400).json({ error: "Error creating Location" });
    }

    res.json(newLocation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const location = await Location.findById(locationId);
    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json(location);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const { locationId } = req.body;

    const location = await Location.findByIdAndUpdate(locationId, req.body, {
      new: true,
    });

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json(location);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const location = await Location.findByIdAndDelete(locationId);

    if (!location) {
      return res.status(404).json({ error: "Location not found" });
    }

    res.json({ message: "Location deleted successfully" });
  } catch (err) {
    console.error("Error deleting location:", err);
    res.status(500).json({ error: "Failed to delete location" });
  }
};

export const getAllLocations = async (req, res) => {
  try {
    const { userId } = req.body;
    const locations = await Location.find({ userId });

    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllLocations = async (req, res) => {
  try {
    const { userId } = req.body;
    await Location.deleteMany({ userId });

    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
