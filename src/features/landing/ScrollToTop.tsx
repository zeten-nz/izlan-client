"use client";

import { useEffect } from "react";

/**
 * Landing har gal ko'ringanda (login/register'dan qaytganda ham) tepadan boshlansin.
 * Next oldingi sahifani xotirada saqlaydi va skroll joyini eslab qoladi; hash bor havolalarga (/#tariflar) tegmaymiz.
 */
export function ScrollToTop() {
  useEffect(() => {
    if (!window.location.hash) window.scrollTo(0, 0);
  }, []);
  return null;
}
