const mongoose = require("mongoose");

const nodeSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true
        },
        content: {
            type: String,
            default: ""
        },
        children: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Node"
            }
        ],
        locked: {
            type: Boolean,
            default: false
        },
        lockedBy: {
            type: String,
            default: null
        },
        lockedAt: {
            type: Date,
            default: null
        }
    },
    {
        timestamps: true
    }
);

const validateNestedChildren = async (
    Node,
    nodeId,
    visited = new Set()
) => {
    const id = nodeId.toString();

    if (visited.has(id)) {
        throw new Error(
            `Circular node relationship detected at node ${id}`
        );
    }

    visited.add(id);

    const node = await Node.findById(nodeId);

    if (!node) {
        throw new Error(
            `Referenced child node ${id} does not exist`
        );
    }

    for (const childId of node.children) {
        await validateNestedChildren(
            Node,
            childId,
            new Set(visited)
        );
    }
};

nodeSchema.pre("save", async function () {
    const Node = this.constructor;

    console.log(`Validating Node relationships: ${this._id}`);

    for (const childId of this.children) {
        await validateNestedChildren(
            Node,
            childId,
            new Set([this._id.toString()])
        );
    }

    console.log(`Node relationships validated: ${this._id}`);
});

const Node = mongoose.model("Node", nodeSchema);

module.exports = Node;