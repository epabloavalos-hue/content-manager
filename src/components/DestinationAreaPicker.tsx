"use client";

import { DESTINATION_AREAS } from "@/lib/constants";

interface Props {
  selected: string[];
  onChange: (areas: string[]) => void;
}

export default function DestinationAreaPicker({ selected, onChange }: Props) {
  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {DESTINATION_AREAS.map((area) => {
        const active = selected.includes(area.value);
        return (
          <button
            key={area.value}
            type="button"
            onClick={() => toggle(area.value)}
            className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-left transition-all ${
              active
                ? "border-[var(--brand)] bg-[var(--brand)]/10"
                : "border-[#1f3320] bg-[#162216] hover:border-[var(--brand)]/30"
            }`}
          >
            <div className={`mt-0.5 w-4 h-4 rounded shrink-0 border-2 flex items-center justify-center transition-all ${
              active ? "border-[var(--brand)] bg-[var(--brand)]" : "border-gray-600"
            }`}>
              {active && (
                <svg viewBox="0 0 10 8" className="w-2.5 h-2.5" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="#000" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div>
              <p className={`text-sm font-bold leading-tight ${active ? "text-white" : "text-gray-300"}`}>
                {area.label}
              </p>
              <p className={`text-xs mt-0.5 ${active ? "text-[var(--brand)]" : "text-gray-500"}`}>
                {area.contact}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
