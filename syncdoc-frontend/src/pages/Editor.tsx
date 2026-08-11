import { useState } from "react";
import DocumentList from "../components/document/DocumentList";
import EditorComponent from "../components/editor/Editor";
import type{ Document } from "../types";

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

function EditorPage() {
  const [documents] = useState<Document[]>(
    sampleDocuments
  );

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
      />

    </div>
  );
}

export default EditorPage;