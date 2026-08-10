"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseClient";

export default function AdminGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Session error:", sessionError);
      }

      if (!session?.user) {
        if (mounted) {
          router.replace("/admin/login");
        }
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      if (profileError) {
        console.error("Profile error:", profileError);
      }

      if (!profile?.is_admin) {
        if (mounted) {
          router.replace("/");
        }
        return;
      }

      if (mounted) {
        setLoading(false);
      }
    }

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return null;
  }

  return <>{children}</>;
}