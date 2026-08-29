import type { ComponentType } from "react";
import type { BlockType, DocumentBlock, EditRange } from "../../../types";

import HeadingBlock from "./HeadingBlock";
import ParagraphBlock from "./ParagraphBlock";
import CodeBlock from "./CodeBlock";

export const blockRegistry: Record<BlockType, ComponentType<BlockComponentProps>> = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  code: CodeBlock,
};

export interface BlockComponentProps {
  block: DocumentBlock;
  onChangeContent: (content: string, range?: EditRange) => void;
}