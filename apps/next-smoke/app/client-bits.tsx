"use client";
// Client-only pieces: the Lottie player (lottie-web touches `window`) and the
// React component library. `@northstar-js/motion`'s entry has no 'use client'
// directive of its own, so it must be imported from a client component.
import { useState } from "react";
import { Lottie } from "@northstar-js/motion";
// @northstar-js/react is built by a parallel workstream (phase 4). If it is
// ever missing from the workspace, this import is what breaks the smoke build,
// which is intended: the gate covers every public package.
import { Button, NorthstarProvider } from "@northstar-js/react";

export function ClientBits() {
  const [clicks, setClicks] = useState(0);
  return (
    <NorthstarProvider theme="night">
      <Lottie scene="ns-globe" />
      <Button onClick={() => setClicks((n) => n + 1)}>Hydrated: {clicks}</Button>
    </NorthstarProvider>
  );
}
