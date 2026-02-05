"use client";

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
}

export function PromptInput({ value, onChange }: PromptInputProps) {
  return (
    <div className="animate-fade-in">
      <div className="flex items-baseline gap-2.5 mb-2">
        <span className="type-label" style={{ color: "var(--text-tertiary)" }}>Prompt</span>
        <span className="type-mono-small" style={{ color: "var(--text-tertiary)", opacity: 0.6 }}>
          optional
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe how the extended areas should look..."
        rows={3}
        className="w-full resize-none focus-visible:outline-none transition-all duration-200 type-body-small"
        style={{
          padding: "10px 12px",
          borderRadius: "var(--radius-md)",
          border: "1px solid rgba(255, 255, 255, 0.06)",
          background: "rgba(255, 255, 255, 0.03)",
          color: "var(--text-primary)",
        }}
        onFocus={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(255, 255, 255, 0.04)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
          e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.06)";
          e.currentTarget.style.boxShadow = "none";
        }}
      />
    </div>
  );
}
