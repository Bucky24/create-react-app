const express = require("express");
const cors = require("cors");

const port = process.env.PORT || 9090;

const app = express();
app.use(cors());

app.get("/ping", (req, res) => {
    res.json({
        success: true,
        data: "pong",
    });
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});