require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const {
  setupWSConnection,
} = require("@y/websocket-server/utils");

const connectDB = require("./src/config/db");
const documentRoutes = require("./src/routes/documentRoutes");

require("./src/models/node");

const app = express();

/*
|--------------------------------------------------------------------------
| Express Configuration
|--------------------------------------------------------------------------
*/

app.use(
  cors({
    origin: "http://localhost:5173",
  })
);

app.use(express.json());

app.use(
  "/api/documents",
  documentRoutes
);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("SyncDoc Backend Running");
});

const server = http.createServer(app);

/*
|--------------------------------------------------------------------------
| Collaborative State
|--------------------------------------------------------------------------
|
| documentId -> Set<WebSocket>
|
|--------------------------------------------------------------------------
*/

const documentRooms = new Map();

/*
|--------------------------------------------------------------------------
| Block Lock State
|--------------------------------------------------------------------------
|
| documentId -> Map<blockId, clientId>
|
|--------------------------------------------------------------------------
*/

const documentBlockLocks = new Map();

/*
|--------------------------------------------------------------------------
| Get Document Room
|--------------------------------------------------------------------------
*/

const getDocumentRoom = (documentId) => {
  if (!documentRooms.has(documentId)) {
    documentRooms.set(
      documentId,
      new Set()
    );

    console.log(
      `Collaborative room created for document: ${documentId}`
    );
  }

  return documentRooms.get(documentId);
};

/*
|--------------------------------------------------------------------------
| Get Block Locks
|--------------------------------------------------------------------------
*/

const getDocumentBlockLocks = (documentId) => {
  if (!documentBlockLocks.has(documentId)) {
    documentBlockLocks.set(
      documentId,
      new Map()
    );
  }

  return documentBlockLocks.get(documentId);
};

/*
|--------------------------------------------------------------------------
| Send JSON
|--------------------------------------------------------------------------
|
| NOTE:
| This is used only for custom control messages.
| We DO NOT send these messages on the Yjs WebSocket.
|
|--------------------------------------------------------------------------
*/

const sendJson = (webSocket, payload) => {
  if (
    webSocket.readyState ===
    webSocket.OPEN
  ) {
    webSocket.send(
      JSON.stringify(payload)
    );
  }
};

/*
|--------------------------------------------------------------------------
| Broadcast JSON
|--------------------------------------------------------------------------
*/

const broadcastJson = (
  documentRoom,
  payload
) => {
  const message =
    JSON.stringify(payload);

  documentRoom.forEach(
    (client) => {
      if (
        client.readyState ===
        client.OPEN
      ) {
        client.send(message);
      }
    }
  );
};

/*
|--------------------------------------------------------------------------
| Release Client Locks
|--------------------------------------------------------------------------
*/

const releaseClientLocks = (
  documentId,
  clientId,
  documentRoom
) => {
  const blockLocks =
    documentBlockLocks.get(
      documentId
    );

  if (!blockLocks) {
    return;
  }

  const releasedBlocks = [];

  blockLocks.forEach(
    (owner, blockId) => {
      if (owner === clientId) {
        blockLocks.delete(
          blockId
        );

        releasedBlocks.push(
          blockId
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | Notify remaining clients
  |--------------------------------------------------------------------------
  */

  releasedBlocks.forEach(
    (blockId) => {
      broadcastJson(
        documentRoom,
        {
          type:
            "block:unlocked",

          blockId,

          clientId,

          reason:
            "client-disconnected",
        }
      );
    }
  );
};

/*
|--------------------------------------------------------------------------
| Yjs WebSocket Server
|--------------------------------------------------------------------------
*/

const webSocketServer =
  new WebSocketServer({
    noServer: true,
  });

/*
|--------------------------------------------------------------------------
| WebSocket Upgrade
|--------------------------------------------------------------------------
|
| Frontend:
|
| ws://localhost:5000/ws/documents/:documentId
|
|--------------------------------------------------------------------------
*/

server.on(
  "upgrade",
  (
    request,
    socket,
    head
  ) => {
    try {
      const url = new URL(
        request.url,
        `http://${request.headers.host}`
      );

      /*
      |--------------------------------------------------------------------------
      | CORRECT WebSocket route
      |--------------------------------------------------------------------------
      */

      const match =
        url.pathname.match(
          /^\/ws\/documents\/([^/]+)$/
        );

      if (!match) {
        console.log(
          `Rejected WebSocket path: ${url.pathname}`
        );

        socket.destroy();

        return;
      }

      const documentId =
        match[1];

      console.log(
        `WebSocket upgrade request for document: ${documentId}`
      );

      /*
      |--------------------------------------------------------------------------
      | Upgrade connection
      |--------------------------------------------------------------------------
      */

      webSocketServer.handleUpgrade(
        request,
        socket,
        head,
        (webSocket) => {
          webSocket.documentId =
            documentId;

          webSocketServer.emit(
            "connection",
            webSocket,
            request
          );
        }
      );
    } catch (error) {
      console.error(
        "WebSocket upgrade error:",
        error
      );

      socket.destroy();
    }
  }
);

/*
|--------------------------------------------------------------------------
| WebSocket Connection
|--------------------------------------------------------------------------
*/

webSocketServer.on(
  "connection",
  (
    webSocket,
    request
  ) => {
    const documentId =
      webSocket.documentId;

    /*
    |--------------------------------------------------------------------------
    | Unique Client ID
    |--------------------------------------------------------------------------
    */

    webSocket.clientId =
      crypto.randomUUID();

    /*
    |--------------------------------------------------------------------------
    | Document Room
    |--------------------------------------------------------------------------
    */

    const documentRoom =
      getDocumentRoom(
        documentId
      );

    documentRoom.add(
      webSocket
    );

    /*
    |--------------------------------------------------------------------------
    | Block Locks
    |--------------------------------------------------------------------------
    */

    const blockLocks =
      getDocumentBlockLocks(
        documentId
      );

    console.log(
      `WebSocket connected for document: ${documentId}`
    );

    console.log(
      `Client ID: ${webSocket.clientId}`
    );

    console.log(
      `Clients in room: ${documentRoom.size}`
    );

    /*
    |--------------------------------------------------------------------------
    | Yjs Setup
    |--------------------------------------------------------------------------
    |
    | IMPORTANT:
    |
    | This socket is a Yjs WebSocket.
    |
    | Do NOT send custom JSON messages such as:
    |
    | connection
    | block:state
    |
    | because WebsocketProvider expects Yjs protocol
    | messages on this connection.
    |
    |--------------------------------------------------------------------------
    */

    try {
      console.log(
        `Before Yjs setup: ${documentId}`
      );

      setupWSConnection(
        webSocket,
        request,
        {
          docName:
            documentId,

          gc: true,
        }
      );

      console.log(
        `After Yjs setup: ${documentId}`
      );

      console.log(
        `Yjs synchronization enabled for document: ${documentId}`
      );

      console.log(
        `WebSocket readyState: ${webSocket.readyState}`
      );
    } catch (error) {
      console.error(
        `Yjs setup error for document ${documentId}:`,
        error
      );

      if (
        webSocket.readyState ===
        webSocket.OPEN
      ) {
        webSocket.close();
      }

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | IMPORTANT
    |--------------------------------------------------------------------------
    |
    | We don't process Yjs binary messages here.
    |
    | setupWSConnection already handles:
    |
    | - SyncStep1
    | - SyncStep2
    | - document updates
    | - awareness
    |
    |--------------------------------------------------------------------------
    */

    /*
    |--------------------------------------------------------------------------
    | DISCONNECT
    |--------------------------------------------------------------------------
    */

    webSocket.on(
      "close",
      (
        code,
        reason
      ) => {
        console.log(
          `WebSocket closed for document ${documentId}`
        );

        console.log(
          `Close code: ${code}`
        );

        console.log(
          `Close reason: ${reason.toString()}`
        );

        /*
        |--------------------------------------------------------------------------
        | Release locks
        |--------------------------------------------------------------------------
        */

        releaseClientLocks(
          documentId,
          webSocket.clientId,
          documentRoom
        );

        /*
        |--------------------------------------------------------------------------
        | Remove client
        |--------------------------------------------------------------------------
        */

        documentRoom.delete(
          webSocket
        );

        console.log(
          `Clients remaining: ${documentRoom.size}`
        );

        /*
        |--------------------------------------------------------------------------
        | Remove empty room
        |--------------------------------------------------------------------------
        */

        if (
          documentRoom.size ===
          0
        ) {
          documentRooms.delete(
            documentId
          );

          documentBlockLocks.delete(
            documentId
          );

          console.log(
            `Room removed for document: ${documentId}`
          );
        }
      }
    );

    /*
    |--------------------------------------------------------------------------
    | WebSocket Error
    |--------------------------------------------------------------------------
    */

    webSocket.on(
      "error",
      (error) => {
        console.error(
          `WebSocket error for document ${documentId}:`,
          error.message
        );
      }
    );
  }
);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const startServer =
  async () => {
    try {
      await connectDB();

      server.listen(
        PORT,
        () => {
          console.log(
            `SyncDoc Backend running on port ${PORT}`
          );

          console.log(
            `WebSocket endpoint: ws://localhost:${PORT}/ws/documents/:documentId`
          );

          console.log(
            "Yjs synchronization: enabled"
          );

          console.log(
            "Block-level locking: enabled"
          );
        }
      );
    } catch (error) {
      console.error(
        "Failed to start server:",
        error
      );

      process.exit(1);
    }
  };

startServer();