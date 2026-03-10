import { type RefObject, useEffect, useRef } from "react";

/**
 * Custom hook to detect clicks outside a component
 * @param handler - Callback function to execute when clicking outside
 * @param isActive - Whether the click outside detection is active
 * @returns RefObject to be attached to the target element
 */
export function useClickOutside<T extends HTMLElement = HTMLElement>(
  handler: () => void,
  isActive: boolean = true,
): RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!isActive) return;

    function handleClickOutside(event: MouseEvent) {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handler, isActive]);

  return ref;
}
