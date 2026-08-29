import { useEffect, useRef, useState, type ChangeEvent, type SyntheticEvent } from "react";
import { blockSelectionStore } from "../../editor-state/blockSelectionStore";
import type { EditRange } from "../../types";

interface EditableFieldProps {
  blockId: string;
  value: string;
  onChange: (value: string, range?: EditRange) => void;
  as?: "input" | "textarea";
  className?: string;
}

function EditableField({ blockId, value, onChange, as = "input", className }: EditableFieldProps) {
  const [draft, setDraft] = useState(value);
  const isFocusedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingRangeRef = useRef<EditRange | undefined>(undefined);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const scheduleSync = (next: string, range?: EditRange) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    pendingRangeRef.current = range;
    debounceRef.current = setTimeout(() => onChange(next, pendingRangeRef.current), 200);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = event.target.value;
    const range: EditRange = {
      start: event.target.selectionStart ?? next.length,
      end: event.target.selectionEnd ?? next.length,
    };

    setDraft(next);
    blockSelectionStore.setSelection({ blockId, ...range });
    scheduleSync(next, range);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    blockSelectionStore.setActiveBlock(blockId);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    blockSelectionStore.setActiveBlock(null);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      onChange(draft, pendingRangeRef.current);
    }
  };

  const handleSelect = (event: SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const target = event.currentTarget;
    blockSelectionStore.setSelection({
      blockId,
      start: target.selectionStart ?? 0,
      end: target.selectionEnd ?? 0,
    });
  };

  const sharedProps = {
    className,
    value: draft,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onSelect: handleSelect,
  };

  if (as === "textarea") {
    return <textarea {...sharedProps} />;
  }

  return <input {...sharedProps} />;
}

export default EditableField;