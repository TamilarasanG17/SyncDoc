export interface SelectionRange {
  blockId: string;
  start: number;
  end: number;
}

export interface BlockSelectionState {
  activeBlockId: string | null;
  selection: SelectionRange | null;
}