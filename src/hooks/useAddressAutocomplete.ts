'use client';
import { useCallback, useRef } from 'react';

const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global { interface Window { google?: any } }

let loadPromise: Promise<void> | null = null;

function loadPlacesScript(): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('gmaps-places-script');
    if (existing) {
      if (window.google?.maps?.places) resolve();
      else existing.addEventListener('load', () => resolve());
      return;
    }
    const s = document.createElement('script');
    s.id = 'gmaps-places-script';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&libraries=places`;
    s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Failed to load Google Maps Places'));
    document.body.appendChild(s);
  });
  return loadPromise;
}

/**
 * Attaches Google Places address-autocomplete suggestions to whatever <input>
 * the returned ref is bound to. Silently no-ops if NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
 * isn't configured -- the field just stays a plain text input.
 *
 * Returns a CALLBACK ref (not a ref object) on purpose: the target <input> is
 * often behind conditional rendering (a later wizard step, a modal that opens
 * later) so it doesn't exist in the DOM yet when this hook's owning component
 * first mounts. A plain `useRef` + `useEffect(() => {...}, [])` would run once,
 * find `ref.current` still null, and never get a second chance. A callback ref
 * fires exactly when React actually attaches/detaches the DOM node, however
 * many renders later that happens.
 */
export function useAddressAutocomplete(onPlaceSelected: (address: string) => void) {
  const onSelectRef = useRef(onPlaceSelected);
  onSelectRef.current = onPlaceSelected;
  const autocompleteRef = useRef<any>(null);
  const currentNodeRef  = useRef<HTMLInputElement | null>(null);

  return useCallback((node: HTMLInputElement | null) => {
    if (autocompleteRef.current && window.google) {
      window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      autocompleteRef.current = null;
    }
    currentNodeRef.current = node;
    if (!node || !MAPS_KEY) return;

    loadPlacesScript()
      .then(() => {
        // bail if the input unmounted (or was swapped for a different node) while the script was loading
        if (currentNodeRef.current !== node || !window.google) return;
        const autocomplete = new window.google.maps.places.Autocomplete(node, { types: ['address'] });
        autocompleteRef.current = autocomplete;
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          onSelectRef.current(place?.formatted_address || node.value || '');
        });
      })
      .catch(() => {/* Maps failed to load -- input remains a plain text field */});
  }, []);
}
