const http = require('http');
const fs = require('fs');
const WebSocket = require('ws');
const WebSocketServer = WebSocket.Server;

// const serverConfig = {
//     key: fs.readFileSync('key.pem'),
//     cert: fs.readFileSync('cert.pem'),
// };

const hostname = '0.0.0.0';
const port = process.env.PORT || 3000;

let honeypots = {};

let timeout_secs = 5*60;

// Create a server for the client html page
const handleRequest = function (request, response) {
    // Render the single client html file for any request the HTTP server receives
    console.log('request received: ' + request.url);

    if (request.url === '/') {
        response.writeHead(200, { 'Content-Type': 'text/html' });
        response.end(fs.readFileSync('index.html'));
    } else if (request.url === '/client.js') {
        response.writeHead(200, { 'Content-Type': 'application/javascript' });
        response.end(fs.readFileSync('client.js'));
    } else if (request.url === '/jsonTree.js') {
        response.writeHead(200, { 'Content-Type': 'application/javascript' });
        response.end(fs.readFileSync('jsonTree.js'));
    } else if (request.url === '/jsonTree.css') {
        response.writeHead(200, { 'Content-Type': 'text/css' });
        response.end(fs.readFileSync('jsonTree.css'));
    } else if (request.url === '/icons.svg') {
        response.writeHead(200, { 'Content-Type': 'image/svg+xml' });
        response.end(fs.readFileSync('icons.svg'));
    } else {
        let base_idx = request.url.indexOf("/", 1);
        let request_base = request.url.substring(1, base_idx == -1 ? undefined : base_idx);
        console.log(request_base);
        if (request_base in honeypots) {
            let data = {};
            data["url"] = request.url;
            data["headers"] = request.headers;
            data["connectio.remoteAddress"] = request.connection.remoteAddress;
            data["time"] = new Date().toString();
            honeypots[request_base].send(JSON.stringify({data: data}));
            response.statusCode = 200;
            response.end("OK");
        } else {
            response.writeHead(404);
            response.end();
        }
    }
};

const httpServer = http.createServer(handleRequest);
httpServer.listen(port, hostname);

// Create a server for handling websocket calls
const wss = new WebSocketServer({ server: httpServer });

function generate_id() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4();
}

wss.on('connection', function (ws) {
    console.log('got ws connection');
    let id = generate_id();
    honeypots[id] = ws
    ws.send(JSON.stringify({id: id}));
    setTimeout(() => {
        ws.close();
        console.log("closed connection");
        delete honeypots[id];
    }, 1000*timeout_secs);
});