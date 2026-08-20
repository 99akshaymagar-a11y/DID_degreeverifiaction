import express from "express";
import cors from "cors";
import degreeRoutes from "./routes/degreeRoutes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register routes
app.use("/api", degreeRoutes);

// Health check
app.get("/health", (req, res) => {
  res.status(200).json({ status: "healthy", timestamp: new Date().toISOString() });
});

export default app;
