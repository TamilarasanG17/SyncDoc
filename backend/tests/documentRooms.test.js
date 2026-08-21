const WebSocket = require("ws");
const Y = require("yjs");

const DOCUMENT_A = "6a81b9c3c832d2aa2a83f3e4";
const DOCUMENT_B = "different-document-123";

const createClient = (documentId) => {
    return new WebSocket(
        `ws://localhost:5000/ws/documents/${documentId}`
    );
};

const waitForOpen = (client) => {
    return new Promise((resolve, reject) => {
        client.once("open", resolve);
        client.once("error", reject);
    });
};

const closeClient = (client) => {
    if (
        client &&
        client.readyState === WebSocket.OPEN
    ) {
        client.close();
    }
};

describe("Collaborative document rooms", () => {
    let clientA;
    let clientB;
    let clientC;

    beforeEach(async () => {
        clientA = createClient(DOCUMENT_A);
        clientB = createClient(DOCUMENT_A);
        clientC = createClient(DOCUMENT_B);

        await Promise.all([
            waitForOpen(clientA),
            waitForOpen(clientB),
            waitForOpen(clientC)
        ]);

        /*
         * Give the server time to add
         * all clients to their rooms.
         */
        await new Promise((resolve) => {
            setTimeout(resolve, 300);
        });
    });

    afterEach(() => {
        closeClient(clientA);
        closeClient(clientB);
        closeClient(clientC);
    });

    test(
        "connects clients to the correct document rooms",
        () => {
            expect(clientA.readyState).toBe(
                WebSocket.OPEN
            );

            expect(clientB.readyState).toBe(
                WebSocket.OPEN
            );

            expect(clientC.readyState).toBe(
                WebSocket.OPEN
            );
        }
    );

    test(
        "keeps different document clients isolated",
        async () => {
            let clientCReceivedUpdate = false;

            const handler = (message, isBinary) => {
                if (
                    isBinary &&
                    message.toString() ===
                        "ROOM_ISOLATION_TEST"
                ) {
                    clientCReceivedUpdate = true;
                }
            };

            clientC.on("message", handler);

            /*
             * Send a test message from Client A.
             *
             * Client A belongs to Document A.
             * Client C belongs to Document B.
             */
            clientA.send(
                Buffer.from("ROOM_ISOLATION_TEST")
            );

            await new Promise((resolve) => {
                setTimeout(resolve, 500);
            });

            clientC.off(
                "message",
                handler
            );

            expect(
                clientCReceivedUpdate
            ).toBe(false);
        },
        10000
    );

    test(
        "synchronizes Yjs updates between clients in the same document",
        async () => {
            const senderDocument = new Y.Doc();
            const receiverDocument = new Y.Doc();

            const text = senderDocument.getText("content");

            text.insert(
                0,
                "Hello from Client A"
            );

            const update = Y.encodeStateAsUpdate(
                senderDocument
            );

            const receivedUpdate = new Promise(
                (resolve, reject) => {
                    const timeout = setTimeout(() => {
                        reject(
                            new Error(
                                "Timed out waiting for Yjs update"
                            )
                        );
                    }, 5000);

                    clientB.on(
                        "message",
                        (message, isBinary) => {
                            if (!isBinary) {
                                return;
                            }

                            clearTimeout(timeout);

                            try {
                                const incomingUpdate =
                                    new Uint8Array(
                                        message.buffer,
                                        message.byteOffset,
                                        message.byteLength
                                    );

                                Y.applyUpdate(
                                    receiverDocument,
                                    incomingUpdate
                                );

                                resolve();
                            } catch (error) {
                                reject(error);
                            }
                        }
                    );
                }
            );

            /*
             * Client A sends a real Yjs update.
             */
            clientA.send(
                Buffer.from(update)
            );

            await receivedUpdate;

            const synchronizedText =
                receiverDocument
                    .getText("content")
                    .toString();

            expect(
                synchronizedText
            ).toBe("Hello from Client A");
        },
        10000
    );
});