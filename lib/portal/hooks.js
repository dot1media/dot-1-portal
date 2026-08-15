// Dot One Media portal - shared React hooks.
import { useState, useEffect } from "react";

export function useIsMobile() {
  const [m, setM] = useState(typeof window !== "undefined" && window.innerWidth < 640);
  useEffect(() => {
    const on = () => setM(window.innerWidth < 640);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return m;
}

