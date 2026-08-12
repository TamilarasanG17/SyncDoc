import { useState } from "react";

import DocumentList from "../components/document/DocumentList";
import EditorComponent from "../components/editor/Editor";

import type{ Document, DocumentBlock } from "../types";

const sampleDocuments: Document[] = [
  {
    id: "1",
    title: "Project Documentation",
    updatedAt: "Today",
  },
  {
    id: "2",
    title: "Meeting Notes",
    updatedAt: "Yesterday",
  },
  {
    id: "3",
    title: "Development Plan",
    updatedAt: "2 days ago",
  },
];

const sampleBlocks: DocumentBlock[] = [
  {
    id: "block-1",
    type: "heading",
    content: "Welcome to SyncDoc",
    level: 1,
  },
  {
    id: "block-2",
    type: "paragraph",
    content:
      "SyncDoc is a structured collaborative document editor.",
  },
  {
    id: "block-3",
    type: "heading",
    content: "Getting Started",
    level: 2,
  },
  {
    id: "block-4",
    type: "paragraph",
    content:
      "Documents are represented using individual blocks.",
  },
  {
    id: "block-5",
    type: "code",
    content:
      "const document = { type: 'document' };",
  },
];

function EditorPage() {
  const [documents] =
    useState<Document[]>(sampleDocuments);

  const [selectedDocumentId, setSelectedDocumentId] =
    useState("1");

  const selectedDocument = documents.find(
    (document) =>
      document.id === selectedDocumentId
  );

  const handleCreateDocument = () => {
    console.log("Create new document");
  };

  return (
    <div className="syncdoc-editor">

      <DocumentList
        documents={documents}
        selectedDocumentId={selectedDocumentId}
        onSelectDocument={setSelectedDocumentId}
        onCreateDocument={handleCreateDocument}
      />

      <EditorComponent
        title={
          selectedDocument?.title ||
          "Untitled Document"
        }
        blocks={sampleBlocks}
      />

    </div>
  );
}

export default EditorPage;