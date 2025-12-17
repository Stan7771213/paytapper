"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export function ConnectSyncOnMount(props: { clientId: string; shouldRun: boolean }) {
  const { clientId, shouldRun } = props;
  const ran = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (ran.current) return;
    if (!shouldRun) return;
    if (!clientId.trim()) return;

    ran.current = true;

    (async () => {
      try {
        const res = await fetch("/api/connect/sync", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clientId }),
        });

        if (res.ok) {
          router.refresh();
        }
      } catch {
        // no-op
      }
    })();
  }, [clientId, shouldRun, router]);

  return null;
}
