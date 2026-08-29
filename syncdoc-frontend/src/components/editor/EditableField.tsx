import { useEffect, useRef, useState, type ChangeEvent, type SyntheticEvent } from "react";
import { blockSelectionStore } from "../../editor-state/blockSelectionStore";

interface EditableFieldProps {
  blockId: string;
  value: string;
  onChange: (value: string) => void;
  as?: "input" | "textarea";
  className?: string;
}

function EditableField({ blockId, value, onChange, as = "input", className }: EditableFieldProps) {
  const [draft, setDraft] = useState(value);
  const isFocusedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const scheduleSync = (next: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => onChange(next), 200);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const next = event.target.value;
    setDraft(next);
    scheduleSync(next);
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
      onChange(draft);
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