const express = require("express");

const port = process.env.PORT || 8080;

const app = express();

app.use(express.static("build"));

// fallback to client for any unhandled paths
app.use("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "build", "index.html"));
});

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});