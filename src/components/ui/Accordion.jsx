import { useState } from 'react';
import { Plus } from 'lucide-react';

export default function Accordion({ items }) {
  const [open, setOpen] = useState(0);
  return (
    <div>
      {items.map((it, i) => (
        <div className={`acc-item ${open === i ? 'open' : ''}`} key={it.q}>
          <h3>
            <button className="acc-btn" aria-expanded={open === i} aria-controls={`acc-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>
              {it.q}
              <span className="plus">
                <Plus size={18} />
              </span>
            </button>
          </h3>
          <div className="acc-panel" id={`acc-${i}`} role="region">
            <div>
              <p>{it.a}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
