import dotenv from "dotenv";
import app from "./app.js";
import { initDatabase } from "./config/db.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // 1. Initialize SQLite database schemas
    await initDatabase();
    
    // 2. Start Express server listener
    app.listen(PORT, () => {
      console.log(`=================================================`);
      console.log(`   MGMU Degree Verification Backend Server running`);
      console.log(`   Listening on port: http://localhost:${PORT}`);
      console.log(`=================================================`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
