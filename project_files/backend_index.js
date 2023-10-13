const express = require("express");
const path = require("path");

const port = process.env.PORT || 9090;

const app = express();

app.use(express.static(path.join(__dirname, "build")));

app.get("/api/ping", (req, res) => {
    res.json({
        success: true,
        data: "pong",
    });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});