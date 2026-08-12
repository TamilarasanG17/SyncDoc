require("dotenv").config();

const express = require("express");
const connectDB = require("./config/db");

const app = express();

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