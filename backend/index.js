import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import taskRouter from "./routes/task.route.js";
import reportRouter from "./routes/report.route.js";

dotenv.config();


let dbConnectionPromise;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI environment variable is missing");
  }

  if (!dbConnectionPromise) {
    dbConnectionPromise = mongoose
      .connect(process.env.MONGO_URI)
      .then(() => {
        console.log("Connected to MongoDB");
      })
      .catch((error) => {
        dbConnectionPromise = null;
        throw error;
      });
  }

  await dbConnectionPromise;
};


const app = express();

app.use(express.json());
app.use(cookieParser());




app.use(
  cors({
    origin: [
      process.env.FRONT_END_URL,
      "http://localhost:5173",
    ],
    credentials: true,
  })
);
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    next(error);
  }
});

// API Routes
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/tasks", taskRouter);
app.use("/api/report", reportRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  return res.status(statusCode).json({
    success: false,
    statusCode,
    message,
  });
});

export default app;

// Local development fallback
if (process.env.NODE_ENV !== "production") {
  app.listen(3000, () => {
    console.log("Server is running on port 3000");
  });
}
