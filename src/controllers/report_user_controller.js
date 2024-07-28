import Report from "../models/report_model.js";

export const addReport = async (req, res) => {
  try {
    const { reportee, reporter } = req.body;

    let existingReport = await Report.findOne({ reportee, reporter });

    if (existingReport) {
      existingReport.set({
        ...req.body,
        timestamps: Date.now(),
      });
      await existingReport.save();
    } else {
      await Report.create(req.body);
    }

    res.json("Report created successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(400).json({ error: "Report not found" });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateReport = async (req, res) => {
  try {
    const { reportId } = req.body;

    const report = await Report.findByIdAndUpdate(reportId, req.body, {
      new: true,
    });

    if (!report) {
      return res.status(400).json({ error: "Report not found" });
    }

    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const report = await Report.findByIdAndDelete(reportId);

    if (!report) {
      return res.status(400).json({ error: "Report not found" });
    }

    res.json({ message: "Report deleted successfully" });
  } catch (err) {
    console.error("Error deleting report:", err);
    res.status(500).json({ error: err.message });
  }
};

export const getAllReports = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const query = {};

    if (type) {
      query.reason = type;
    }

    let countPromise = Report.countDocuments(query);
    let reportsPromise = Report.find(query)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .sort({ timestamp: -1 })
      .populate("reporter reportee", "name username email ipAddress");

    const [totalReports, reports] = await Promise.all([
      countPromise,
      reportsPromise,
    ]);
    const totalPages = Math.ceil(totalReports / limit);

    res.json({
      reports,
      totalPages,
      totalReports,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const manageReports = async (req, res) => {
  try {
    const { reportIds } = req.body;

    if (!reportIds) {
      return res.status(400).json({ error: "Report Ids are required" });
    }

    await Report.deleteMany({ _id: { $in: reportIds } });
    res.json(`Reports deleted successfully`);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteAllReports = async (_, res) => {
  try {
    await Report.deleteMany();
    res.json("Deleted Successfully");
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
