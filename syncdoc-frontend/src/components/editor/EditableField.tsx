import { useEffect, useRef, useState, type ChangeEvent } from "react";

interface EditableFieldProps {
  value: string;
  onChange: (value: string) => void;
  as?: "input" | "textarea";
  className?: string;
}

function EditableField({ value, onChange, as = "input", className }: EditableFieldProps) {
  const [draft, setDraft] = useState(value);
  const isFocusedRef = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Only accept incoming (remote) updates while NOT focused — otherwise a
  // concurrent edit from another client would overwrite what's being typed.
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
  };

  const handleBlur = () => {
    isFocusedRef.current = false;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      onChange(draft);
    }
  };

  if (as === "textarea") {
    return (
      <textarea
        className={className}
        value={draft}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
    );
  }

  return (
    <input
      className={className}
      value={draft}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}

export default EditableField;