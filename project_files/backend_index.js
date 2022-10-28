const express = require("express");

const port = process.env.PORT || 9090;

const app = express();

app.get("/ping", (req, res) => {
    res.send("pong");
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});