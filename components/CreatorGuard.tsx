"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CreatorGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function checkCreatorSession() {
      try {
        const response = await fetch("/api/creator/session", {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          if (mounted) {
            router.replace("/creator/login");
          }
          return;
        }

        if (mounted) {
          setAuthorized(true);
          setLoading(false);
        }
      } catch (error) {
        console.error("Creator session error:", error);

        if (mounted) {
          router.replace("/creator/login");
        }
      }
    }

    checkCreatorSession();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading || !authorized) {
    return null;
  }

  return <>{children}</>;
}