"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { useSession } from "@/lib/auth";
import { useRoles, useTeam } from "@/lib/data";
import { canAccessAction } from "@/lib/permissions-core";

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

export type ConfirmRequest = {
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
};

export function useConfirm() {
  const [request, setRequest] = useState<ConfirmRequest | null>(null);
  const confirm = useCallback((next: ConfirmRequest) => setRequest(() => next), []);
  const close = useCallback(() => setRequest(null), []);
  return { request, confirm, close };
}

/** Resolves the active user's role and optional per-user permission override. */
export function useCan() {
  const { session } = useSession();
  const [roles] = useRoles();
  const [team] = useTeam();
  const permissions = useMemo(() => {
    const account = team.find((member) => member.account && member.email === session?.email);
    if (account?.permissions) return account.permissions;
    return roles.find((role) => role.name === session?.role)?.permissions ?? [];
  }, [roles, session?.email, session?.role, team]);
  return useCallback((permission: string) => canAccessAction(permissions, permission), [permissions]);
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
