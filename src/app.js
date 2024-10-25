import express from 'express';
import cors from "cors"
import cookieParser from "cookie-parser"
import userRouter from './routes/user.routes.js';
import playlistRoute from './routes/playlist.routes.js';
import  VideoRoute  from './routes/video.routes.js';
import subscribeRoute from "./routes/subscription.routes.js";
import commentRoute from "./routes/comment.routes.js";
import likeRoute from "./routes/like.routes.js";
import tweetRoute from "./routes/tweet.routes.js";
import healthcheckRoute from "./routes/healthcheck.routes.js";
import dashboardRoute from "./routes/dashboard.routes.js";

const app = express();
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ limit: "16kb", extended: true }))
app.use(express.static("public"))
app.use(cookieParser())

app.use("/api/v1/users", userRouter)
app.use("/api/v1/playlist", playlistRoute)
app.use("/api/v1/video", VideoRoute)
app.use("/api/v1/subscribe", subscribeRoute)
app.use("/api/v1/comment", commentRoute)
app.use("/api/v1/like", likeRoute)
app.use("/api/v1/tweet", tweetRoute)
app.use("/api/v1/check", healthcheckRoute)
app.use("/api/v1/dashboard", dashboardRoute)





export { app }