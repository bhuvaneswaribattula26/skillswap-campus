import { X } from 'lucide-react';

export default function SkillPill({ name, type = 'teach', level, onRemove }) {
  return (
    <span className={type === 'teach' ? 'pill-teach' : 'pill-learn'}>
      {name}
      {level ? <span className="opacity-60">· {level}</span> : null}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 rounded-full hover:bg-black/10 p-0.5">
          <X size={12} />
        </button>
      )}
    </span>
  );
}
