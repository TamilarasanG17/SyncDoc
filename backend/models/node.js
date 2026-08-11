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
        }
    },
    {
        timestamps: true
    }
);

const Node = mongoose.model("Node", nodeSchema);

module.exports = Node;