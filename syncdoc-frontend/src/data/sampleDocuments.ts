import type{ Document, DocumentBlock } from "../types";

export interface SampleDocument extends Document {
  blocks: DocumentBlock[];
}

export const sampleDocuments: SampleDocument[] = [
  {
    id: "1",
    title: "Project Documentation",
    updatedAt: "Today",
    blocks: [
      {
        id: "1-1",
        type: "heading",
        content: "Project Documentation",
        level: 1,
      },
      {
        id: "1-2",
        type: "paragraph",
        content:
          "This document contains the project documentation for SyncDoc.",
      },
      {
        id: "1-3",
        type: "heading",
        content: "Introduction",
        level: 2,
      },
      {
        id: "1-4",
        type: "paragraph",
        content:
          "SyncDoc is a structured collaborative document editor.",
      },
      {
        id: "1-5",
        type: "code",
        content:
          "const document = { type: 'document' };",
      },
    ],
  },

  {
    id: "2",
    title: "Meeting Notes",
    updatedAt: "Yesterday",
    blocks: [
      {
        id: "2-1",
        type: "heading",
        content: "Meeting Notes",
        level: 1,
      },
      {
        id: "2-2",
        type: "paragraph",
        content:
          "Discussion about the SyncDoc project progress.",
      },
      {
        id: "2-3",
        type: "heading",
        content: "Topics Discussed",
        level: 2,
      },
      {
        id: "2-4",
        type: "paragraph",
        content:
          "Frontend editor structure and document rendering.",
      },
    ],
  },

  {
    id: "3",
    title: "Development Plan",
    updatedAt: "2 days ago",
    blocks: [
      {
        id: "3-1",
        type: "heading",
        content: "Development Plan",
        level: 1,
      },
      {
        id: "3-2",
        type: "paragraph",
        content:
          "The application will be developed using React and TypeScript.",
      },
      {
        id: "3-3",
        type: "heading",
        content: "Frontend",
        level: 2,
      },
      {
        id: "3-4",
        type: "paragraph",
        content:
          "The frontend provides the document browsing and block editor interface.",
      },
    ],
  },
];