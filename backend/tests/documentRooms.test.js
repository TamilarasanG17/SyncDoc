const WebSocket = require("ws");
const Y = require("yjs");

const encoding = require("lib0/encoding");
const decoding = require("lib0/decoding");
const syncProtocol = require("y-protocols/sync");
jest.setTimeout(30000);

const DOCUMENT_A =
    "6a81b9c3c832d2aa2a83f3e4";

const DOCUMENT_B =
    "different-document-123";

const createClient = (
    documentId
) => {
    return new WebSocket(
        `ws://localhost:5000/ws/documents/${documentId}`
    );
};

const waitForOpen = (
    client
) => {
    return new Promise(
        (resolve, reject) => {
            client.once(
                "open",
                resolve
            );

            client.once(
                "error",
                reject
            );
        }
    );
};

const closeClient = (
    client
) => {
    if (
        client &&
        (
            client.readyState ===
                WebSocket.OPEN ||
            client.readyState ===
                WebSocket.CONNECTING
        )
    ) {
        client.close();
    }
};

const waitForJsonMessage = (
    client,
    type,
    timeout = 5000
) => {
    return new Promise(
        (resolve, reject) => {
            const handler = (
                message,
                isBinary
            ) => {
                if (isBinary) {
                    return;
                }

                try {
                    const payload =
                        JSON.parse(
                            message.toString()
                        );

                    if (
                        payload.type ===
                        type
                    ) {
                        clearTimeout(
                            timer
                        );

                        client.off(
                            "message",
                            handler
                        );

                        resolve(
                            payload
                        );
                    }
                } catch {
                    // Ignore invalid messages.
                }
            };

            const timer =
                setTimeout(
                    () => {
                        client.off(
                            "message",
                            handler
                        );

                        reject(
                            new Error(
                                `Timed out waiting for ${type}`
                            )
                        );
                    },
                    timeout
                );

            client.on(
                "message",
                handler
            );
        }
    );
};

/*
 * Wait for a Yjs protocol message.
 *
 * IMPORTANT:
 * @y/websocket-server sends Yjs protocol
 * messages, not raw Y.encodeStateAsUpdate()
 * buffers.
 */
const waitForYjsMessage = (
    client,
    timeout = 5000
) => {
    return new Promise(
        (resolve, reject) => {
            const handler = (
                message,
                isBinary
            ) => {
                if (!isBinary) {
                    return;
                }

                clearTimeout(
                    timer
                );

                client.off(
                    "message",
                    handler
                );

                resolve(
                    new Uint8Array(
                        message
                    )
                );
            };

            const timer =
                setTimeout(
                    () => {
                        client.off(
                            "message",
                            handler
                        );

                        reject(
                            new Error(
                                "Timed out waiting for Yjs message"
                            )
                        );
                    },
                    timeout
                );

            client.on(
                "message",
                handler
            );
        }
    );
};

/*
 * Send a Yjs update using the protocol
 * expected by @y/websocket-server.
 */
const sendYjsUpdate = (
    client,
    update
) => {
    const encoder =
        encoding.createEncoder();

    /*
     * Message type 0 = sync
     */
    encoding.writeVarUint(
        encoder,
        0
    );

    /*
     * Sync update message.
     */
    syncProtocol.writeUpdate(
        encoder,
        update
    );

    client.send(
        Buffer.from(
            encoding.toUint8Array(
                encoder
            )
        )
    );
};

/*
 * Apply a received Yjs protocol message
 * to a local Y.Doc.
 */
const applyYjsMessage = (
    doc,
    message
) => {
    const decoder =
        decoding.createDecoder(
            message
        );

    const messageType =
        decoding.readVarUint(
            decoder
        );

    /*
     * 0 = Yjs sync message
     */
    if (
        messageType !== 0
    ) {
        return;
    }

    /*
     * Read sync message.
     *
     * The encoder is only required because
     * readSyncMessage can generate a reply.
     */
    const replyEncoder =
        encoding.createEncoder();

    syncProtocol.readSyncMessage(
        decoder,
        replyEncoder,
        doc,
        null
    );
};

const connectClient = async (
    documentId
) => {
    const client =
        createClient(
            documentId
        );

    const connectionPromise =
        waitForJsonMessage(
            client,
            "connection"
        );

    await waitForOpen(
        client
    );

    const connection =
        await connectionPromise;

    return {
        client,
        connection
    };
};

describe(
    "Collaborative document rooms",
    () => {
        let clientA;
        let clientB;
        let clientC;

        beforeEach(
            async () => {
                const connectionA =
                    connectClient(
                        DOCUMENT_A
                    );

                const connectionB =
                    connectClient(
                        DOCUMENT_A
                    );

                const connectionC =
                    connectClient(
                        DOCUMENT_B
                    );

                const results =
                    await Promise.all(
                        [
                            connectionA,
                            connectionB,
                            connectionC
                        ]
                    );

                clientA =
                    results[0].client;

                clientB =
                    results[1].client;

                clientC =
                    results[2].client;
            }
        );

        afterEach(
            () => {
                closeClient(
                    clientA
                );

                closeClient(
                    clientB
                );

                closeClient(
                    clientC
                );
            }
        );

        test(
            "connects clients to the correct document rooms",
            () => {
                expect(
                    clientA.readyState
                ).toBe(
                    WebSocket.OPEN
                );

                expect(
                    clientB.readyState
                ).toBe(
                    WebSocket.OPEN
                );

                expect(
                    clientC.readyState
                ).toBe(
                    WebSocket.OPEN
                );
            }
        );

        test(
            "keeps different document clients isolated",
            async () => {
                let received =
                    false;

                const handler = (
                    message,
                    isBinary
                ) => {
                    if (
                        isBinary &&
                        message.toString() ===
                            "ROOM_ISOLATION_TEST"
                    ) {
                        received =
                            true;
                    }
                };

                clientC.on(
                    "message",
                    handler
                );

                clientA.send(
                    Buffer.from(
                        "ROOM_ISOLATION_TEST"
                    )
                );

                await new Promise(
                    (resolve) =>
                        setTimeout(
                            resolve,
                            500
                        )
                );

                clientC.off(
                    "message",
                    handler
                );

                expect(
                    received
                ).toBe(false);
            },
            10000
        );

        /*
         * DAY 3
         */
        test(
            "synchronizes Yjs updates between clients in the same document",
            async () => {
                const sender =
                    new Y.Doc();

                const receiver =
                    new Y.Doc();

                sender
                    .getText(
                        "content"
                    )
                    .insert(
                        0,
                        "Hello from Client A"
                    );

                const update =
                    Y.encodeStateAsUpdate(
                        sender
                    );

                /*
                 * Start waiting BEFORE sending.
                 */
                const received =
                    waitForYjsMessage(
                        clientB
                    );

                /*
                 * Send update using the
                 * Yjs sync protocol.
                 */
                sendYjsUpdate(
                    clientA,
                    update
                );

                const receivedMessage =
                    await received;

                /*
                 * Apply the received Yjs
                 * protocol message.
                 */
                applyYjsMessage(
                    receiver,
                    receivedMessage
                );

                expect(
                    receiver
                        .getText(
                            "content"
                        )
                        .toString()
                ).toBe(
                    "Hello from Client A"
                );
            },
            10000
        );

        /*
         * DAY 4
         */
        test(
            "locks an individual document block",
            async () => {
                const blockId =
                    "block-1";

                const locked =
                    waitForJsonMessage(
                        clientB,
                        "block:locked"
                    );

                clientA.send(
                    JSON.stringify({
                        type:
                            "block:lock",
                        blockId
                    })
                );

                const message =
                    await locked;

                expect(
                    message.blockId
                ).toBe(
                    blockId
                );

                expect(
                    message.clientId
                ).toBeTruthy();
            }
        );

        test(
            "prevents another client from locking the same block",
            async () => {
                const blockId =
                    "locked-block";

                const locked =
                    waitForJsonMessage(
                        clientA,
                        "block:locked"
                    );

                clientA.send(
                    JSON.stringify({
                        type:
                            "block:lock",
                        blockId
                    })
                );

                await locked;

                const denied =
                    waitForJsonMessage(
                        clientB,
                        "block:lock-denied"
                    );

                clientB.send(
                    JSON.stringify({
                        type:
                            "block:lock",
                        blockId
                    })
                );

                const message =
                    await denied;

                expect(
                    message.blockId
                ).toBe(
                    blockId
                );

                expect(
                    message.lockedBy
                ).toBeTruthy();
            }
        );

        test(
            "allows different clients to lock different blocks",
            async () => {
                const blockA =
                    "block-A";

                const blockB =
                    "block-B";

                const lockedA =
                    waitForJsonMessage(
                        clientB,
                        "block:locked"
                    );

                clientA.send(
                    JSON.stringify({
                        type:
                            "block:lock",
                        blockId:
                            blockA
                    })
                );

                const messageA =
                    await lockedA;

                expect(
                    messageA.blockId
                ).toBe(
                    blockA
                );

                const lockedB =
                    waitForJsonMessage(
                        clientA,
                        "block:locked"
                    );

                clientB.send(
                    JSON.stringify({
                        type:
                            "block:lock",
                        blockId:
                            blockB
                    })
                );

                const messageB =
                    await lockedB;

                expect(
                    messageB.blockId
                ).toBe(
                    blockB
                );
            }
        );

        test(
            "allows the owner to unlock a block",
            async () => {
                const blockId =
                    "unlock-block";

                const locked =
                    waitForJsonMessage(
                        clientB,
                        "block:locked"
                    );

                clientA.send(
                    JSON.stringify({
                        type:
                            "block:lock",
                        blockId
                    })
                );

                await locked;

                const unlocked =
                    waitForJsonMessage(
                        clientB,
                        "block:unlocked"
                    );

                clientA.send(
                    JSON.stringify({
                        type:
                            "block:unlock",
                        blockId
                    })
                );

                const message =
                    await unlocked;

                expect(
                    message.blockId
                ).toBe(
                    blockId
                );
            }
        );

        /*
         * DAY 5
         */
        test(
            "synchronizes concurrent edits from multiple clients",
            async () => {
                const documentId =
                    `concurrent-${Date.now()}`;

                const clients =
                    await Promise.all(
                        Array.from(
                            {
                                length: 4
                            },
                            () =>
                                connectClient(
                                    documentId
                                )
                        )
                    );

                const docs =
                    clients.map(
                        () =>
                            new Y.Doc()
                    );

                const updates =
                    [];

                clients.forEach(
                    (
                        result,
                        index
                    ) => {
                        const doc =
                            docs[index];

                        doc.getText(
                            "content"
                        ).insert(
                            0,
                            `Edit-${index + 1}`
                        );

                        updates.push(
                            Y.encodeStateAsUpdate(
                                doc
                            )
                        );
                    }
                );

                const received =
                    clients
                        .slice(1)
                        .map(
                            (
                                result
                            ) =>
                                waitForYjsMessage(
                                    result.client,
                                    10000
                                )
                        );

                clients.forEach(
                    (
                        result,
                        index
                    ) => {
                        sendYjsUpdate(
                            result.client,
                            updates[index]
                        );
                    }
                );

                await Promise.all(
                    received
                );

                const merged =
                    new Y.Doc();

                updates.forEach(
                    (update) => {
                        Y.applyUpdate(
                            merged,
                            update
                        );
                    }
                );

                const content =
                    merged
                        .getText(
                            "content"
                        )
                        .toString();

                expect(
                    content
                ).toContain(
                    "Edit-1"
                );

                expect(
                    content
                ).toContain(
                    "Edit-2"
                );

                expect(
                    content
                ).toContain(
                    "Edit-3"
                );

                expect(
                    content
                ).toContain(
                    "Edit-4"
                );

                clients.forEach(
                    (result) =>
                        closeClient(
                            result.client
                        )
                );
            },
            20000
        );

        /*
         * DAY 6
         */
        test(
            "supports ten simultaneous clients",
            async () => {
                const documentId =
                    `ten-client-${Date.now()}`;

                const clients =
                    await Promise.all(
                        Array.from(
                            {
                                length: 10
                            },
                            () =>
                                connectClient(
                                    documentId
                                )
                        )
                    );

                expect(
                    clients.length
                ).toBe(10);

                const clientIds =
                    new Set(
                        clients.map(
                            (result) =>
                                result
                                    .connection
                                    .clientId
                        )
                    );

                expect(
                    clientIds.size
                ).toBe(10);

                const sender =
                    new Y.Doc();

                sender
                    .getText(
                        "content"
                    )
                    .insert(
                        0,
                        "10 client synchronization test"
                    );

                const update =
                    Y.encodeStateAsUpdate(
                        sender
                    );

                const receivers =
                    clients
                        .slice(1)
                        .map(
                            (result) =>
                                waitForYjsMessage(
                                    result.client,
                                    10000
                                )
                        );

                sendYjsUpdate(
                    clients[0].client,
                    update
                );

                await Promise.all(
                    receivers
                );

                clients.forEach(
                    (result) =>
                        closeClient(
                            result.client
                        )
                );
            },
            20000
        );

        test(
            "releases a block lock when its owner disconnects",
            async () => {
                const documentId =
                    `disconnect-${Date.now()}`;

                const first =
                    await connectClient(
                        documentId
                    );

                const second =
                    await connectClient(
                        documentId
                    );

                const blockId =
                    "disconnect-block";

                const locked =
                    waitForJsonMessage(
                        second.client,
                        "block:locked"
                    );

                first.client.send(
                    JSON.stringify({
                        type:
                            "block:lock",
                        blockId
                    })
                );

                await locked;

                first.client.close();

                await new Promise(
                    (resolve) =>
                        setTimeout(
                            resolve,
                            300
                        )
                );

                const newOwner =
                    await connectClient(
                        documentId
                    );

                const lockAgain =
                    waitForJsonMessage(
                        newOwner.client,
                        "block:locked"
                    );

                newOwner.client.send(
                    JSON.stringify({
                        type:
                            "block:lock",
                        blockId
                    })
                );

                const message =
                    await lockAgain;

                expect(
                    message.blockId
                ).toBe(
                    blockId
                );

                closeClient(
                    second.client
                );

                closeClient(
                    newOwner.client
                );
            },
            15000
        );
    }
);