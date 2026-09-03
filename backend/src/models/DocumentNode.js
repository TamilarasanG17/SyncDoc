import mongoose from 'mongoose';

const { Schema } = mongoose;

/**
 * AST Node schema (Week 1 - "AST Database" module).
 *
 * A SyncDoc document is stored as a tree of nodes, mirroring the Abstract
 * Syntax Tree that the Yjs CRDT layer manipulates in real time. Each node
 * can hold arbitrary children of the SAME shape, which is what makes this
 * recursive: a Mongoose schema can embed itself as a sub-document array by
 * declaring `children` after the schema object is created.
 *
 * type: the structural kind of the block (mirrors block types used by the
 *       frontend editor and the Yjs Y.Map representation of each block).
 * attrs: free-form structural metadata (e.g. heading level, language for a
 *        code block, list ordered/unordered, alignment, etc.)
 * content: leaf text content (only meaningful for leaf/text-bearing nodes).
 * order: sibling ordering index, kept explicit (rather than relying purely
 *        on array position) so re-ordering during merges is traceable.
 * parentId: denormalized back-reference used by the recursive pre-save hook
 *           below to validate/repair parent-child relationships even though
 *           Mongo's document model already nests children physically.
 */
const documentNodeSchema = new Schema(
  {
    nodeId: { type: String, required: true },
    parentId: { type: String, default: null },
    type: {
      type: String,
      required: true,
      enum: ['document', 'heading', 'paragraph', 'codeBlock', 'list', 'listItem', 'text'],
    },
    attrs: { type: Schema.Types.Mixed, default: {} },
    content: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

// Recursive self-reference: a document node's children are themselves
// document nodes. This has to be assigned after schema creation because
// the schema can't reference itself while still being constructed.
documentNodeSchema.add({ children: [documentNodeSchema] });

/**
 * Recursively walks the node tree before every save:
 *  - assigns a nodeId to any node missing one
 *  - re-derives parentId on every child so the denormalized pointer can
 *    never drift out of sync with actual nesting
 *  - re-derives `order` from array position when it's absent
 * This is the "deep pre-save hook validation" called out in the project spec.
 */
function traceBlockRelationships(node, parentId, siblingIndex) {
  if (!node.nodeId) {
    node.nodeId = new mongoose.Types.ObjectId().toString();
  }
  node.parentId = parentId;
  if (node.order === undefined || node.order === null) {
    node.order = siblingIndex;
  }
  if (Array.isArray(node.children)) {
    node.children.forEach((child, idx) => traceBlockRelationships(child, node.nodeId, idx));
  }
}

documentNodeSchema.pre('validate', function preValidateRoot() {
  // `this` is only reachable at the root when this schema is embedded as
  // `root` on the Document model below (see documentNodeSchema.pre hook
  // registered there is skipped for nested subdocs by Mongoose, so the
  // actual recursive pass is triggered from Document's pre-save hook).
});

export { documentNodeSchema, traceBlockRelationships };
