"use client";

import { type RefObject, useEffect, useRef } from "react";

/**
 * Hook to trap focus within a modal or dialog for accessibility.
 * Ensures focus stays within the modal when using Tab/Shift+Tab.
 *
 * @param isOpen - Whether the modal is currently open
 * @param onClose - Optional callback to close modal on Escape key
 * @returns ref to attach to the modal container element
 */
export function useFocusTrap<T extends HTMLElement>(isOpen: boolean, onClose?: () => void): RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Store the element that had focus before modal opened
    previousActiveElement.current = document.activeElement as HTMLElement;

    const modalElement = ref.current;
    if (!modalElement) return;

    // Focus first focusable element in modal
    const focusableElements = modalElement.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      firstElement.focus();
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Handle Escape key
      if (e.key === "Escape" && onClose) {
        e.preventDefault();
        onClose();
        return;
      }

      // Handle Tab key (focus trap)
      if (e.key === "Tab") {
        if (focusableElements.length === 0) return;

        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);

      // Restore focus to previous element when modal closes
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  return ref;
}
