"use client";

import { useEffect } from "react";

export function RotationCount({ count }: { count: number }) {
  useEffect(() => { console.log(`Images in rotation: ${count}`); }, [count]);
  return null;
}
