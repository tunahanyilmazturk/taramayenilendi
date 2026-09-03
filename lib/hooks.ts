"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

/** Temporary status message that clears itself after `duration` ms. */
export function useNotice(duration = 2400) {
  const [notice, setNotice] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const show = useCallback(
    (message: string) => {
      window.clearTimeout(timer.current);
      setNotice(message);
      timer.current = window.setTimeout(() => setNotice(""), duration);
    },
    [duration],
  );
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return [notice, show] as const;
}

/** Calls `onOutside` when a pointer event lands outside `ref` or Escape is pressed. */
export function useDismiss(ref: RefObject<HTMLElement | null>, active: boolean, onOutside: () => void) {
  useEffect(() => {
    if (!active) return;
    const onPointer = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) onOutside();
    };
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onOutside();
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, active, onOutside]);
}

/** Generic sort state helper for list pages. */
export function useSort<K extends string>(initialKey: K, initialDirection: "asc" | "desc" = "asc") {
  const [sortKey, setSortKey] = useState<K>(initialKey);
  const [direction, setDirection] = useState<"asc" | "desc">(initialDirection);
  const toggle = useCallback(
    (key: K) => {
      if (key === sortKey) setDirection((current) => (current === "asc" ? "desc" : "asc"));
      else {
        setSortKey(key);
        setDirection("asc");
      }
    },
    [sortKey],
  );
  return { sortKey, direction, toggle };
}
