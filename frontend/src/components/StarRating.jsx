import { Star } from 'lucide-react';

export default function StarRating({ value = 0, onChange, size = 16, readOnly = false }) {
  const stars = [1, 2, 3, 4, 5];
  return (
    <div className="flex items-center gap-0.5">
      {stars.map((s) => (
        <button
          key={s}
          type="button"
          disabled={readOnly}
          onClick={() => onChange && onChange(s)}
          className={readOnly ? 'cursor-default' : 'cursor-pointer'}
        >
          <Star
            size={size}
            className={s <= Math.round(value) ? 'fill-accent-500 text-accent-500' : 'text-slate-300'}
          />
        </button>
      ))}
    </div>
  );
}
