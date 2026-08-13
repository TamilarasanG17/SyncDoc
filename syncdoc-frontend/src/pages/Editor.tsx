import { useNavigate, useParams } from "react-router-dom";

import DocumentList from "../components/document/DocumentList";
import EditorComponent from "../components/editor/Editor";

import { sampleDocuments } from "../data/sampleDocuments";

function EditorPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const selectedDocument =
    sampleDocuments.find(
      (document) => document.id === id
    ) || sampleDocuments[0];

  const handleSelectDocument = (
    documentId: string
  ) => {
    navigate(`/editor/${documentId}`);
  };

  const handleCreateDocument = () => {
    console.log("Create new document");
  };

  return (
    <div className="syncdoc-editor">

      <DocumentList
        documents={sampleDocuments}
        selectedDocumentId={selectedDocument.id}
        onSelectDocument={handleSelectDocument}
        onCreateDocument={handleCreateDocument}
      />

      <EditorComponent
        title={selectedDocument.title}
        blocks={selectedDocument.blocks}
      />

    </div>
  );
}

export default EditorPage;