'use client';

import { useEffect, useId, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { MoreVertical } from 'lucide-react';

export interface PostMenuItem {
  key: string;
  label: string;
  icon: LucideIcon;
  onSelect: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface PostActionMenuProps {
  items: PostMenuItem[];
  label?: string;
  disabled?: boolean;
}

/**
 * Accessible three-dot menu: click/Enter/Space toggles, arrow keys move,
 * Escape and outside clicks close.
 */
export function PostActionMenu({ items, label = 'Post actions', disabled }: PostActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [alignTop, setAlignTop] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const toggle = () => {
    if (!open && buttonRef.current) {
      // Flip upwards when the menu would overflow the viewport bottom.
      const rect = buttonRef.current.getBoundingClientRect();
      setAlignTop(window.innerHeight - rect.bottom < items.length * 40 + 24);
    }
    setOpen((value) => !value);
  };

  const focusItem = (index: number) => {
    const enabled = items.map((item, i) => (item.disabled ? -1 : i)).filter((i) => i >= 0);
    if (enabled.length === 0) return;
    const wrapped = ((index % enabled.length) + enabled.length) % enabled.length;
    itemRefs.current[enabled[wrapped]]?.focus();
  };

  const onMenuKeyDown = (event: React.KeyboardEvent, index: number) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(index + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(index - 1);
    } else if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative inline-block text-left">
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={label}
        disabled={disabled}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && open) {
            event.preventDefault();
            focusItem(0);
          }
        }}
        className="rounded-lg p-1.5 text-[#6B7C93] transition-colors hover:bg-[#F1F5F9] hover:text-[#043658] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#043658]/40 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open && (
        <div
          id={menuId}
          role="menu"
          className={`absolute right-0 z-30 w-52 overflow-hidden rounded-lg border border-[#D9E2EC] bg-white py-1 shadow-lg ${
            alignTop ? 'bottom-full mb-1' : 'top-full mt-1'
          }`}
        >
          {items.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
                onKeyDown={(event) => onMenuKeyDown(event, index)}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                  item.destructive
                    ? 'text-red-600 hover:bg-red-50 focus-visible:bg-red-50'
                    : 'text-[#043658] hover:bg-[#F8FAFC] focus-visible:bg-[#F8FAFC]'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
