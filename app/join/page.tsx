"use client";
import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";

function JoinInner() {
  const params = useSearchParams();
  const ref = params.get("ref");

  useEffect(() => {
    if (ref) {
      sessionStorage.setItem("oeh_ref_code", ref);
    }
    window.location.href = "/signin?join=1";
  }, [ref]);

  return null;
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinInner />
    </Suspense>
  );
}
