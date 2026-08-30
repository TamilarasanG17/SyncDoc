require("dotenv").config();
const Y = require("yjs");

const express = require("express");
const cors = require("cors");
const http = require("http");
const crypto = require("crypto");
const { WebSocketServer } = require("ws");

const { setupWSConnection } = require("@y/websocket-server/utils");
const { LeveldbPersistence } = require("y-leveldb");
const persistence = new LeveldbPersistence("./yjs-data");

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

app.use("/api/documents", documentRoutes);

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
    documentRooms.set(documentId, new Set());

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
    documentBlockLocks.set(documentId, new Map());
  }

  return documentBlockLocks.get(documentId);
};

/*
|--------------------------------------------------------------------------
| Send JSON
|--------------------------------------------------------------------------
*/

const sendJson = (webSocket, payload) => {
  if (webSocket.readyState === webSocket.OPEN) {
    webSocket.send(JSON.stringify(payload));
  }
};

/*
|--------------------------------------------------------------------------
| Broadcast JSON
|--------------------------------------------------------------------------
*/

const broadcastJson = (documentRoom, payload, excludeClient = null) => {
  const message = JSON.stringify(payload);

  documentRoom.forEach((client) => {
    if (
      client !== excludeClient &&
      client.readyState === client.OPEN
    ) {
      client.send(message);
    }
  });
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
  const blockLocks = documentBlockLocks.get(documentId);

  if (!blockLocks) {
    return;
  }

  const releasedBlocks = [];

  blockLocks.forEach((owner, blockId) => {
    if (owner === clientId) {
      blockLocks.delete(blockId);
      releasedBlocks.push(blockId);
    }
  });

  releasedBlocks.forEach((blockId) => {
    broadcastJson(documentRoom, {
      type: "block:unlocked",
      blockId,
      clientId,
      reason: "client-disconnected",
    });
  });
};

/*
|--------------------------------------------------------------------------
| WebSocket Server
|--------------------------------------------------------------------------
*/

const webSocketServer = new WebSocketServer({
  noServer: true,
});

/*
|--------------------------------------------------------------------------
| WebSocket Upgrade
|--------------------------------------------------------------------------
|
| Frontend:
| ws://localhost:5000/ws/documents/:documentId
|
|--------------------------------------------------------------------------
*/

server.on("upgrade", (request, socket, head) => {
  try {
    const url = new URL(
      request.url,
      `http://${request.headers.host}`
    );

    const match = url.pathname.match(
      /^\/ws\/documents\/([^/]+)$/
    );

    if (!match) {
      console.log(
        `Rejected WebSocket path: ${url.pathname}`
      );

      socket.destroy();
      return;
    }

    const documentId = match[1];

    console.log(
      `WebSocket upgrade request for document: ${documentId}`
    );

    webSocketServer.handleUpgrade(
      request,
      socket,
      head,
      (webSocket) => {
        webSocket.documentId = documentId;

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
});

/*
|--------------------------------------------------------------------------
| WebSocket Connection
|--------------------------------------------------------------------------
*/

webSocketServer.on(
  "connection",
  async (webSocket, request) => {
    console.log(
  "[WS DEBUG] connection handler entered"
);
    const documentId = webSocket.documentId;

    /*
    |--------------------------------------------------------------------------
    | Unique Client ID
    |--------------------------------------------------------------------------
    */

    webSocket.clientId = crypto.randomUUID();

    /*
    |--------------------------------------------------------------------------
    | Document Room
    |--------------------------------------------------------------------------
    */

    const documentRoom = getDocumentRoom(documentId);

    documentRoom.add(webSocket);

    /*
    |--------------------------------------------------------------------------
    | Block Locks
    |--------------------------------------------------------------------------
    */

    getDocumentBlockLocks(documentId);

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
    */

    try {
      console.log(
        `Before Yjs setup: ${documentId}`
      );
     const yjsDoc = require("@y/websocket-server/utils").getYDoc(
  documentId,
  true
);
console.log(
  `[PERSISTENCE DEBUG] Loading document from LevelDB: ${documentId}`
);

const persistedDoc = await persistence.getYDoc(documentId);

if (persistedDoc) {
  const persistedUpdate = Y.encodeStateAsUpdate(persistedDoc);
  Y.applyUpdate(yjsDoc, persistedUpdate);

  console.log(
    `[PERSISTENCE DEBUG] Restored document from LevelDB: ${documentId}`
  );
}

yjsDoc.on("update", async (update) => {
  try {
    await persistence.storeUpdate(documentId, update);

    console.log(
      `[PERSISTENCE DEBUG] Update stored: ${documentId}`
    );
  } catch (error) {
    console.error(
      `[PERSISTENCE ERROR] Failed to store update for ${documentId}:`,
      error
    );
  }
});



yjsDoc.on("error", (error) => {
  console.error(
    "[YJS DOC ERROR]",
    error
  );
});

      setupWSConnection(
        webSocket,
        request,
        {
          docName: documentId,
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

      if (webSocket.readyState === webSocket.OPEN) {
        webSocket.close();
      }

      return;
    }

    /*
    |--------------------------------------------------------------------------
    | Connection Metadata
    |--------------------------------------------------------------------------
    |
    | This is a JSON control message.
    | Yjs binary messages are still handled by
    | setupWSConnection.
    |
    |--------------------------------------------------------------------------
    */

    
    /*
    |--------------------------------------------------------------------------
    | Custom Control Messages
    |--------------------------------------------------------------------------
    |
    | We only process text/JSON messages here.
    | Binary messages belong to Yjs.
    |
    |--------------------------------------------------------------------------
    */

   /* webSocket.on("message", (message, isBinary) => {
       console.log(
     "[CUSTOM WS] message listener triggered",
    "[Custom WS] message received:",
    "isBinary =", isBinary,
    "type =", typeof message,
    "length =", message?.length
  );

      if (isBinary) {
        return;
      }

      let payload;

      try {
        payload = JSON.parse(message.toString());
      } catch (error) {
        return;
      }

      if (!payload || !payload.type) {
        return;
      }

      const blockLocks =
        getDocumentBlockLocks(documentId);

      /*
      |--------------------------------------------------------------------------
      | Block Lock
      |--------------------------------------------------------------------------
      */

      /* if (payload.type === "block:lock") {
        const { blockId } = payload;

        if (!blockId) {
          return;
        }

        const existingOwner =
          blockLocks.get(blockId);

        if (existingOwner) {
          sendJson(webSocket, {
            type: "block:lock-denied",
            blockId,
            lockedBy: existingOwner,
          });

          return;
        }

        blockLocks.set(
          blockId,
          webSocket.clientId
        );

        broadcastJson(documentRoom, {
          type: "block:locked",
          blockId,
          clientId: webSocket.clientId,
        });

        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Block Unlock
      |--------------------------------------------------------------------------
      */

     /* if (payload.type === "block:unlock") {
        const { blockId } = payload;

        if (!blockId) {
          return;
        }

        const existingOwner =
          blockLocks.get(blockId);

        if (
          existingOwner !== webSocket.clientId
        ) {
          return;
        }

        blockLocks.delete(blockId);

        broadcastJson(documentRoom, {
          type: "block:unlocked",
          blockId,
          clientId: webSocket.clientId,
        });

        return;
      }
    });

    /*
    |--------------------------------------------------------------------------
    | Disconnect
    |--------------------------------------------------------------------------
    */

    webSocket.on(
      "close",
      (code, reason) => {
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
        | Release Locks
        |--------------------------------------------------------------------------
        */

        releaseClientLocks(
          documentId,
          webSocket.clientId,
          documentRoom
        );

        /*
        |--------------------------------------------------------------------------
        | Remove Client
        |--------------------------------------------------------------------------
        */

        documentRoom.delete(webSocket);

        console.log(
          `Clients remaining: ${documentRoom.size}`
        );

        /*
        |--------------------------------------------------------------------------
        | Remove Empty Room
        |--------------------------------------------------------------------------
        */

        if (documentRoom.size === 0) {
          documentRooms.delete(documentId);
          documentBlockLocks.delete(documentId);

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

   webSocket.on("error", (error) => {
  console.error(
    `[WS ERROR] document ${documentId}:`,
    error
  );
});
  }
);

/*
|--------------------------------------------------------------------------
| Start Server
|--------------------------------------------------------------------------
*/

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
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
    });
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
};

startServer();