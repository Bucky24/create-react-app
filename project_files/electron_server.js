const express = require('express');
const webpack = require('webpack');
const fs = require('fs');
const path = require('path');
const ws = require('ws');

const config = require('./webpack.config.js');
const commands = require('./server/commands');

const compiler = webpack(config);

const wsServer = new ws.Server({ noServer: true });
// this assumes one connection for now
let activeSocket = { current: null };
wsServer.on('connection', socket => {
    activeSocket.current = socket;
});

const watching = compiler.watch({
    aggregateTimeout: 300,
    poll: undefined
}, (err, stats) => {
    if (activeSocket.current) {
        activeSocket.current.send('reload');
    }
    console.log(stats.toString());
});

const port = 8080;
const app = express();

app.use(express.json());

function sendFile(res, file) {
    res.contentType(path.basename(file));
    fs.createReadStream(file).pipe(res);
}

app.get('/', (req, res) => {
    sendFile(res, path.join(__dirname, "build", "index.html"));
});

app.post('/api', async (req, res) => {
    const { command, data } = req.body;

	if (!commands[command]) {
		console.error('Unknown command', command);
		res.status(404);
        res.end();
        return;
	}
	
	const result = await commands[command](data);

    res.header('content-type', 'text/json');
    res.status(200);
    res.send(JSON.stringify({ data: result }));
    res.end();
});

app.get("*", (req, res) => {
    const buildPath = path.resolve(__dirname, "build", req.url.substr(1));
    if (fs.existsSync(buildPath)) {
        sendFile(res, buildPath);
    } else {
        res.status(404);
        res.end();
    }
});

const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});
server.on('upgrade', (request, socket, head) => {
    wsServer.handleUpgrade(request, socket, head, socket => {
        wsServer.emit('connection', socket, request);
    });
});