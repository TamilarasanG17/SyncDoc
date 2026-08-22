import type { ComponentType } from "react";
import type { BlockType, DocumentBlock } from "../../../types";

import HeadingBlock from "./HeadingBlock";
import ParagraphBlock from "./ParagraphBlock";
import CodeBlock from "./CodeBlock";

export interface BlockComponentProps {
  block: DocumentBlock;
  onChangeContent: (content: string) => void;
}

export const blockRegistry: Record<BlockType, ComponentType<BlockComponentProps>> = {
  heading: HeadingBlock,
  paragraph: ParagraphBlock,
  code: CodeBlock,
};