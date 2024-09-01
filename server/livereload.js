import http from "node:http";
import fs from "node:fs";
import serveStatic from "serve-static";
import { WebSocketServer } from "ws";
import logger from "gulplog";

function liveReloadClient(res) {
  fs.readFile("./client/livereload.js", (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
    } else {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.end(data);
    }
  });
}

export default function livereload(directory) {
  const server = http.createServer((req, res) => {
    if (req.url === "/livereload.js") {
      liveReloadClient(res);
    } else {
      serveStatic(directory)(req, res, () => {
        res.writeHead(404);
        res.end("Not found");
      });
    }
  });

  const wss = new WebSocketServer({ server, path: "/livereload" });

  wss.on("connection", (ws) => {
    logger.info("WebSocket connected");
    ws.on("close", () => {
      logger.info("WebSocket disconnected");
    });
  });

  wss.on("error", (error) => {
    logger.error("WebSocket error:", error);
  });

  return {
    server,
    start() {
      server.listen(0, () => {
        logger.info(
          `Server running at http://localhost:${server.address().port}`,
        );
      });
    },
    reload() {
      logger.info("Reloading browsers");
      wss.clients.forEach((client) => {
        client.send("reload");
      });
    },
    stop() {
      server.close();
    },
  };
}
