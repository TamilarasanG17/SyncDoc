const WebSocket = require("ws");

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
});