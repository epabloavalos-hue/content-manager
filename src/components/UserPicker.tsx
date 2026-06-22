"use client";

interface User {
  id: string;
  name: string;
  position: string | null;
  department: string | null;
}

interface Props {
  users: User[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export default function UserPicker({ users, selected, onChange }: Props) {
  function toggle(id: string) {
    if (selected.includes(id)) onChange(selected.filter((v) => v !== id));
    else onChange([...selected, id]);
  }

  if (users.length === 0) {
    return <p className="text-xs text-gray-600 italic py-2">No hay usuarios disponibles.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      {users.map((u) => {
        const checked = selected.includes(u.id);
        return (
          <button
            key={u.id}
            type="button"
            onClick={() => toggle(u.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-all ${
              checked
                ? "border-[var(--brand)]/60 bg-[var(--brand)]/10"
                : "border-[#1f3320] bg-[#162216] hover:border-[var(--brand)]/30"
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
              checked ? "border-[var(--brand)] bg-[var(--brand)]" : "border-gray-600"
            }`}>
              {checked && <span className="text-black text-[9px] font-black">✓</span>}
            </div>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${checked ? "text-white" : "text-gray-300"}`}>{u.name}</p>
              {u.position && <p className="text-xs text-gray-500 truncate">{u.position}</p>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
