// import EditorHeader from "./EditorHeader";
// import BlockContainer from "./BlockContainer";
// import { CollaborationProvider } from "../../collaboration/CollaborationContext";
// import { useSyncedBlocks } from "../../hooks/useSyncedBlocks";
// import { useLocalAwareness } from "../../hooks/useLocalAwareness";
// import type { DocumentBlock } from "../../types";

// interface EditorBodyProps {
//   title: string;
//   blocks: DocumentBlock[];
// }

// function EditorBody({ title, blocks }: EditorBodyProps) {
//   const { blocks: syncedBlocks, updateBlockContent } = useSyncedBlocks(blocks);
//   const { setEditingBlock, localUserId } = useLocalAwareness();

//   return (
//     <section className="editor">
//       <EditorHeader title={title} localUserId={localUserId} />
//       <BlockContainer
//         blocks={syncedBlocks}
//         localUserId={localUserId}
//         onEditBlock={setEditingBlock}
//         onChangeBlockContent={updateBlockContent}
//       />
//     </section>
//   );
// }

// interface EditorProps {
//   documentId: string;
//   title: string;
//   blocks: DocumentBlock[];
// }

// function Editor({ documentId, title, blocks }: EditorProps) {
//   return (
//     <CollaborationProvider key={documentId} documentId={documentId}>
//       <EditorBody title={title} blocks={blocks} />
//     </CollaborationProvider>
//   );
// }

// export default Editor;

import EditorHeader from "./EditorHeader";
import BlockContainer from "./BlockContainer";
import { CollaborationProvider } from "../../collaboration/CollaborationContext";
import BlockSelectionProvider from "../../editor-state/BlockSelectionProvider";
import { useSyncedBlocks } from "../../hooks/useSyncedBlocks";
import { useLocalAwareness } from "../../hooks/useLocalAwareness";
import type { DocumentBlock } from "../../types";

interface EditorBodyProps {
  title: string;
  blocks: DocumentBlock[];
}

function EditorBody({ title, blocks }: EditorBodyProps) {
  const { blocks: syncedBlocks, updateBlockContent } = useSyncedBlocks(blocks);
  const { setEditingBlock, localUserId } = useLocalAwareness();

  return (
    <BlockSelectionProvider>
      <section className="editor">
        <EditorHeader title={title} localUserId={localUserId} />
        <BlockContainer
          blocks={syncedBlocks}
          localUserId={localUserId}
          onEditBlock={setEditingBlock}
          onChangeBlockContent={updateBlockContent}
        />
      </section>
    </BlockSelectionProvider>
  );
}

interface EditorProps {
  documentId: string;
  title: string;
  blocks: DocumentBlock[];
}

function Editor({ documentId, title, blocks }: EditorProps) {
  return (
    <CollaborationProvider key={documentId} documentId={documentId}>
      <EditorBody title={title} blocks={blocks} />
    </CollaborationProvider>
  );
}

export default Editor;