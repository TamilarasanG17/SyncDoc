require("dotenv").config();

const express = require("express");
const cors = require("cors");

const connectDB = require("./src/config/db");
const documentRoutes = require("./src/routes/documentRoutes");
require("./src/models/node");

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173"
    })
);

app.use(express.json());

app.use("/api/documents", documentRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("SyncDoc Backend Running");
});

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`SyncDoc Backend running on port ${PORT}`);
    });
};

startServer();