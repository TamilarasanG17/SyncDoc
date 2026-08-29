# SyncDoc  Transformation Engine Design

## 1. Purpose

The Transformation Engine converts the SyncDoc AST document structure into clean output structures that can later be used for PDF and HTML generation.

The transformation process must preserve the document hierarchy, node order, node type and node content.

---

## 2. AST Transformation Flow

The transformation flow will follow this pipeline:

Document
   ↓
Root AST Node
   ↓
Recursive AST Traversal
   ↓
Node Type Detection
   ↓
Node Content Transformation
   ↓
Transformed Document Structure
   ↓
Output Generator
   ├── HTML
   └── PDF

The transformation layer will remain separate from the database layer.

The database stores the AST structure, while the transformation layer converts that structure into an output-ready representation.

---

## 3. Required Document Nodes

The transformation engine must support the main document node types used by SyncDoc.

### Heading

Used for document headings.

Example:

{
  "type": "heading",
  "content": "Introduction"
}

Output representation:

{
  "type": "heading",
  "content": "Introduction"
}

---

### Paragraph

Used for normal document text.

Example:

{
  "type": "paragraph",
  "content": "This is a paragraph."
}

Output representation:

{
  "type": "paragraph",
  "content": "This is a paragraph."
}

---

### Code Block

Used for source code or formatted code content.

Example:

{
  "type": "code",
  "content": "const x = 10;"
}

Output representation:

{
  "type": "code",
  "content": "const x = 10;"
}

---

### Text

Used for text content inside structured nodes where applicable.

Example:

{
  "type": "text",
  "content": "Hello SyncDoc"
}

---

### Container / Parent Node

Parent nodes may contain child AST nodes.

Example:

{
  "type": "section",
  "content": "Introduction",
  "children": [
    {
      "type": "heading",
      "content": "Overview"
    },
    {
      "type": "paragraph",
      "content": "SyncDoc is a collaborative document engine."
    }
  ]
}

The transformation engine must recursively process the children array.

---

## 4. Transformation Rules

1. Preserve the original document order.
2. Preserve node types.
3. Preserve node content.
4. Recursively process child nodes.
5. Ignore invalid or unsupported nodes safely.
6. Do not modify the original AST during transformation.
7. Produce a clean output structure.
8. Keep transformation logic independent from MongoDB models.
9. Prepare the transformed structure so it can later be converted to HTML or PDF.
10. Preserve parent-child relationships during transformation.

---

## 5. Recursive Transformation

Nested AST structures must be transformed recursively.

Example:

Document
├── Heading
├── Paragraph
└── Section
    ├── Heading
    ├── Paragraph
    └── Code

The transformation process should traverse:

Root
 ↓
Child
 ↓
Child
 ↓
Nested Child

Each node is transformed independently while maintaining its position in the document hierarchy.

---

## 6. Output Structure

The transformation engine will produce a normalized structure similar to:

{
  "documentId": "document-id",
  "title": "Document Title",
  "nodes": [
    {
      "type": "heading",
      "content": "Introduction",
      "children": []
    },
    {
      "type": "paragraph",
      "content": "Document content",
      "children": []
    }
  ]
}

This structure will later be consumed by:

AST
 ↓
Transformation Utilities
 ↓
Normalized Output
 ├── HTML Generator
 └── PDF Generator

---

## 7. Separation of Responsibilities

### MongoDB / Mongoose

Responsible for:

- Storing documents
- Storing AST nodes
- Maintaining document relationships
- Retrieving AST data

### Transformation Engine

Responsible for:

- Traversing AST nodes
- Detecting node types
- Transforming node content
- Preserving relationships
- Producing normalized output

### Output Generators

Responsible for:

- Converting transformed data to HTML
- Converting transformed data to PDF

---

## 8. Week 3 Implementation Plan

### Day 1

Design transformation flow and identify required AST nodes.

### Day 2

Implement transformation utilities.

### Day 3

Add recursive processing for nested AST nodes.

### Day 4

Implement PDF-oriented output generation.

### Day 5

Implement HTML transformation/output.

### Day 6

Test complex nested documents and malformed AST cases.

### Day 7

Complete and prepare backend transformation/export functionality.

---

## 9. Design Goal

The Transformation Engine should provide a clean separation between:

AST Storage
     ↓
AST Transformation
     ↓
Output Generation

This allows the same transformed AST structure to be reused for both HTML and PDF output.