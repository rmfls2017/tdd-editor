import { C } from "../constants/theme.js";

const VARIANTS = {
  run:    { color: C.ac, icon: '▶' },
  edit:   { color: C.or, icon: '✎' },
  delete: { color: C.rd, icon: '×' },
};

const SIZES = {
  sm: { width: 14, height: 14, fontSize: 8, borderRadius: 2 },
  md: { width: 22, height: 22, fontSize: 10, borderRadius: 2 },
};

export const ActionButton = ({ variant, size = 'md', onClick }) => {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  return (
    <button
      onClick={onClick}
      style={{
        width: s.width, height: s.height,
        background: 'transparent',
        border: `1px solid ${v.color}`,
        borderRadius: s.borderRadius,
        color: v.color,
        cursor: 'pointer',
        fontSize: s.fontSize,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 0,
      }}
    >
      {v.icon}
    </button>
  );
};
