const express = require("express");

const app = express();

const PORT = 5000;

app.get("/", (req, res) => {
    res.send("SyncDoc Backend Running");
});

app.listen(PORT, () => {
    console.log(`SyncDoc Backend running on port ${PORT}`);
});