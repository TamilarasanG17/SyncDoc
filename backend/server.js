require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const { WebSocketServer } = require("ws");
const Y = require("yjs");

const connectDB = require("./src/config/db");
const documentRoutes = require("./src/routes/documentRoutes");
require("./src/models/node");

const app = express();

app.use(
    cors({
        origin: "http://localhost:5173"
    })
);

app.use(express.json());

app.use("/api/documents", documentRoutes);

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
    res.send("SyncDoc Backend Running");
});

/*
 * Create HTTP server from Express app.
 */
const server = http.createServer(app);

/*
 * Store one Y.Doc for each document.
 *
 * documentId -> Y.Doc
 */
const yDocuments = new Map();

/*
 * Store connected WebSocket clients
 * for each document room.
 *
 * documentId -> Set<WebSocket>
 */
const documentRooms = new Map();

/*
 * Get or create Y.Doc for a document.
 */
const getYDocument = (documentId) => {
    if (!yDocuments.has(documentId)) {
        yDocuments.set(documentId, new Y.Doc());

        console.log(
            `Y.Doc created for document: ${documentId}`
        );
    }

    return yDocuments.get(documentId);
};

/*
 * Get or create a collaborative room
 * for a document.
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
 * WebSocket server.
 *
 * Endpoint:
 * ws://localhost:5000/ws/documents/:documentId
 */
const webSocketServer = new WebSocketServer({
    noServer: true
});

/*
 * WebSocket upgrade routing.
 */
server.on("upgrade", (request, socket, head) => {
    const url = new URL(
        request.url,
        `http://${request.headers.host}`
    );

    const match = url.pathname.match(
        /^\/ws\/documents\/([^/]+)$/
    );

    if (!match) {
        socket.destroy();
        return;
    }

    const documentId = match[1];

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
});

/*
 * Handle WebSocket connections.
 */
webSocketServer.on("connection", (webSocket) => {
    const documentId = webSocket.documentId;

    const yDocument = getYDocument(documentId);

    /*
     * Join the client to the document room.
     */
    const documentRoom = getDocumentRoom(documentId);

    documentRoom.add(webSocket);

    console.log(
        `WebSocket connected for document: ${documentId}`
    );

    console.log(
        `Clients in document room ${documentId}: ${documentRoom.size}`
    );

    /*
     * Send connection confirmation.
     */
    webSocket.send(
        JSON.stringify({
            type: "connection",
            message: "SyncDoc WebSocket connected",
            documentId
        })
    );

    /*
     * Send current Yjs document state
     * to the newly connected client.
     */
    const currentState = Y.encodeStateAsUpdate(
        yDocument
    );

    if (currentState.length > 0) {
        webSocket.send(Buffer.from(currentState));

        console.log(
            `Current Yjs state sent to document client: ${documentId}`
        );
    }

    /*
     * Receive Yjs updates from clients.
     */
    webSocket.on("message", (message, isBinary) => {
        try {
            /*
             * Ignore non-binary messages.
             */
            if (!isBinary) {
                console.log(
                    `Non-binary WebSocket message received for document ${documentId}:`,
                    message.toString()
                );

                return;
            }

            /*
             * Convert incoming data to Uint8Array.
             */
            const update = new Uint8Array(
                message.buffer,
                message.byteOffset,
                message.byteLength
            );

            /*
             * Apply update to server-side Y.Doc.
             */
            Y.applyUpdate(
                yDocument,
                update
            );

            /*
             * Broadcast update only to clients
             * inside the same document room.
             */
            documentRoom.forEach((client) => {
                if (
                    client !== webSocket &&
                    client.readyState === 1
                ) {
                    client.send(Buffer.from(update));
                }
            });

            console.log(
                `Yjs update processed for document: ${documentId}`
            );

            console.log(
                `Update broadcast to ${documentRoom.size - 1} other client(s)`
            );
        } catch (error) {
            console.error(
                `Failed to process Yjs update for document ${documentId}:`,
                error.message
            );
        }
    });

    /*
     * Handle WebSocket disconnection.
     */
    webSocket.on("close", () => {
        /*
         * Remove client from document room.
         */
        documentRoom.delete(webSocket);

        console.log(
            `WebSocket disconnected for document: ${documentId}`
        );

        console.log(
            `Clients remaining in document room ${documentId}: ${documentRoom.size}`
        );

        /*
         * Remove empty room.
         */
        if (documentRoom.size === 0) {
            documentRooms.delete(documentId);

            console.log(
                `Collaborative room removed for document: ${documentId}`
            );
        }
    });

    /*
     * Handle WebSocket errors.
     */
    webSocket.on("error", (error) => {
        console.error(
            `WebSocket error for document ${documentId}:`,
            error.message
        );
    });
});

const startServer = async () => {
    await connectDB();

    server.listen(PORT, () => {
        console.log(
            `SyncDoc Backend running on port ${PORT}`
        );

        console.log(
            `WebSocket endpoint: ws://localhost:${PORT}/ws/documents/:documentId`
        );
    });
};

startServer();