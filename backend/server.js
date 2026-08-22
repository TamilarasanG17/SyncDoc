require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const crypto = require("crypto");
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

const server = http.createServer(app);

/*
 * documentId -> Y.Doc
 */
const yDocuments = new Map();

/*
 * documentId -> Set<WebSocket>
 */
const documentRooms = new Map();

/*
 * documentId -> Map<blockId, clientId>
 */
const documentBlockLocks = new Map();

/*
 * Get or create Y.Doc.
 */
const getYDocument = (documentId) => {
    if (!yDocuments.has(documentId)) {
        yDocuments.set(
            documentId,
            new Y.Doc()
        );

        console.log(
            `Y.Doc created for document: ${documentId}`
        );
    }

    return yDocuments.get(documentId);
};

/*
 * Get or create document room.
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
 * Get or create block-lock state.
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
 * Send JSON message to one client.
 */
const sendJson = (
    webSocket,
    payload
) => {
    if (webSocket.readyState === 1) {
        webSocket.send(
            JSON.stringify(payload)
        );
    }
};

/*
 * Broadcast JSON message to all
 * clients in the same document room.
 */
const broadcastJson = (
    documentRoom,
    payload
) => {
    const message =
        JSON.stringify(payload);

    documentRoom.forEach((client) => {
        if (client.readyState === 1) {
            client.send(message);
        }
    });
};

/*
 * Release all locks owned by a client.
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
                        "client-disconnected"
                }
            );
        }
    );
};

/*
 * WebSocket server.
 */
const webSocketServer =
    new WebSocketServer({
        noServer: true
    });

/*
 * WebSocket upgrade routing.
 *
 * ws://localhost:5000/ws/documents/:documentId
 */
server.on(
    "upgrade",
    (request, socket, head) => {
        const url = new URL(
            request.url,
            `http://${request.headers.host}`
        );

        const match =
            url.pathname.match(
                /^\/ws\/documents\/([^/]+)$/
            );

        if (!match) {
            socket.destroy();
            return;
        }

        const documentId =
            match[1];

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
    }
);

/*
 * WebSocket connection.
 */
webSocketServer.on(
    "connection",
    (webSocket) => {
        const documentId =
            webSocket.documentId;

        /*
         * Give every connected client
         * a unique identifier.
         */
        webSocket.clientId =
            crypto.randomUUID();

        const yDocument =
            getYDocument(
                documentId
            );

        const documentRoom =
            getDocumentRoom(
                documentId
            );

        const blockLocks =
            getDocumentBlockLocks(
                documentId
            );

        documentRoom.add(
            webSocket
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
         * Connection confirmation.
         */
        sendJson(
            webSocket,
            {
                type:
                    "connection",
                message:
                    "SyncDoc WebSocket connected",
                documentId,
                clientId:
                    webSocket.clientId
            }
        );

        /*
         * Send current block-lock state
         * to newly connected client.
         */
        const currentLocks =
            Array.from(
                blockLocks.entries()
            ).map(
                ([blockId, clientId]) => ({
                    blockId,
                    clientId
                })
            );

        sendJson(
            webSocket,
            {
                type:
                    "block:state",
                locks:
                    currentLocks
            }
        );

        /*
         * Send current Yjs state.
         */
        const currentState =
            Y.encodeStateAsUpdate(
                yDocument
            );

        if (currentState.length > 0) {
            webSocket.send(
                Buffer.from(
                    currentState
                )
            );
        }

        /*
         * Receive messages.
         */
        webSocket.on(
            "message",
            (message, isBinary) => {
                try {
                    /*
                     * Binary = Yjs update.
                     */
                    if (isBinary) {
                        const update =
                            new Uint8Array(
                                message.buffer,
                                message.byteOffset,
                                message.byteLength
                            );

                        /*
                         * Apply update to
                         * server Y.Doc.
                         */
                        Y.applyUpdate(
                            yDocument,
                            update
                        );

                        /*
                         * Send update to
                         * other clients in
                         * same document.
                         */
                        documentRoom.forEach(
                            (client) => {
                                if (
                                    client !==
                                        webSocket &&
                                    client.readyState ===
                                        1
                                ) {
                                    client.send(
                                        Buffer.from(
                                            update
                                        )
                                    );
                                }
                            }
                        );

                        return;
                    }

                    /*
                     * Text = collaboration
                     * control message.
                     */
                    const payload =
                        JSON.parse(
                            message.toString()
                        );

                    /*
                     * =========================
                     * BLOCK LOCK
                     * =========================
                     */
                    if (
                        payload.type ===
                        "block:lock"
                    ) {
                        const blockId =
                            payload.blockId;

                        if (!blockId) {
                            sendJson(
                                webSocket,
                                {
                                    type:
                                        "block:lock-denied",
                                    reason:
                                        "blockId is required"
                                }
                            );

                            return;
                        }

                        const currentOwner =
                            blockLocks.get(
                                blockId
                            );

                        /*
                         * Another client already
                         * owns this block.
                         */
                        if (
                            currentOwner &&
                            currentOwner !==
                                webSocket.clientId
                        ) {
                            sendJson(
                                webSocket,
                                {
                                    type:
                                        "block:lock-denied",
                                    blockId,
                                    lockedBy:
                                        currentOwner
                                }
                            );

                            return;
                        }

                        /*
                         * Lock belongs to this client.
                         */
                        blockLocks.set(
                            blockId,
                            webSocket.clientId
                        );

                        broadcastJson(
                            documentRoom,
                            {
                                type:
                                    "block:locked",
                                blockId,
                                clientId:
                                    webSocket.clientId,
                                lockedAt:
                                    new Date().toISOString()
                            }
                        );

                        return;
                    }

                    /*
                     * =========================
                     * BLOCK UNLOCK
                     * =========================
                     */
                    if (
                        payload.type ===
                        "block:unlock"
                    ) {
                        const blockId =
                            payload.blockId;

                        if (!blockId) {
                            sendJson(
                                webSocket,
                                {
                                    type:
                                        "block:unlock-denied",
                                    reason:
                                        "blockId is required"
                                }
                            );

                            return;
                        }

                        const currentOwner =
                            blockLocks.get(
                                blockId
                            );

                        /*
                         * Only lock owner can
                         * unlock the block.
                         */
                        if (
                            currentOwner !==
                            webSocket.clientId
                        ) {
                            sendJson(
                                webSocket,
                                {
                                    type:
                                        "block:unlock-denied",
                                    blockId,
                                    lockedBy:
                                        currentOwner ||
                                        null
                                }
                            );

                            return;
                        }

                        blockLocks.delete(
                            blockId
                        );

                        broadcastJson(
                            documentRoom,
                            {
                                type:
                                    "block:unlocked",
                                blockId,
                                clientId:
                                    webSocket.clientId
                            }
                        );

                        return;
                    }

                    /*
                     * Unknown message.
                     */
                    sendJson(
                        webSocket,
                        {
                            type:
                                "error",
                            message:
                                "Unknown message type"
                        }
                    );
                } catch (error) {
                    console.error(
                        "WebSocket message error:",
                        error.message
                    );

                    sendJson(
                        webSocket,
                        {
                            type:
                                "error",
                            message:
                                "Invalid WebSocket message"
                        }
                    );
                }
            }
        );

        /*
         * Client disconnected.
         */
        webSocket.on(
            "close",
            () => {
                /*
                 * Release client's locks.
                 */
                releaseClientLocks(
                    documentId,
                    webSocket.clientId,
                    documentRoom
                );

                /*
                 * Remove client from room.
                 */
                documentRoom.delete(
                    webSocket
                );

                console.log(
                    `WebSocket disconnected for document: ${documentId}`
                );

                console.log(
                    `Clients remaining: ${documentRoom.size}`
                );

                /*
                 * Remove empty room state.
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

const startServer = async () => {
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
        }
    );
};

startServer();