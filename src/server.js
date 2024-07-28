import membershipHistory from "./routes/membership_history_detail_router.js";
import membershipTimeRouter from "./routes/membership_time_router.js";
import membershipPlanRouter from "./routes/membership_plan_router.js";
import restrictionRouter from "./routes/restriction_router.js";
import helpCenterRouter from "./routes/help_center_router.js";
import onBoardingRouter from "./routes/on_boarding_router.js";
import attachmentRouter from "./routes/attachment_router.js";
import locationRouter from "./routes/locations_router.js";
import reportRouter from "./routes/report_user_router.js";
import interestRouter from "./routes/interest_router.js";
import checkToken from "./middlewares/check_token.js";
import fileRouter from "./routes/file_router.js";
import authRouter from "./routes/auth_router.js";
import s3Router from "./routes/s3_router.js";
import express from "express";
import cors from "cors";
import http from "http";
import blacklistRouter from "./routes/blacklist_router.js";

const app = express();
app.get("/", (_, res) => res.send("<h2>Hello World</h2>"));

const corsOptions = {
  origin: process.env.CORS_ORIGIN,
  optionsSuccessStatus: 204,
  preflightContinue: false,
  methods: "GET, POST",
  credentials: true,
};

app.use(cors(corsOptions));

app.use(express.json());
app.use(express.static("public"));
app.use("/uploads", express.static("public/uploads"));

app.use("/file/api", checkToken, fileRouter);
app.use("/auth/api", checkToken, authRouter);
app.use("/s3_file/api", checkToken, s3Router);
app.use("/report/api", checkToken, reportRouter);
app.use("/location/api", checkToken, locationRouter);
app.use("/interest/api", checkToken, interestRouter);
app.use("/blacklist/api", checkToken, blacklistRouter);
app.use("/attachment/api", checkToken, attachmentRouter);
app.use("/on_boarding/api", checkToken, onBoardingRouter);
app.use("/help_center/api", checkToken, helpCenterRouter);
app.use("/restriction/api", checkToken, restrictionRouter);
app.use("/membership_plan/api", checkToken, membershipPlanRouter);
app.use("/membership_time/api", checkToken, membershipTimeRouter);
app.use("/membership_history/api", checkToken, membershipHistory);

const server = http.createServer(app);
export default server;
