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
        ]
    },
    {
        timestamps: true
    }
);

const Node = mongoose.model("Node", nodeSchema);

module.exports = Node;