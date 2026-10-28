// Progressive feedback only: unsupported/disabled hardware leaves all controls
// unchanged. Durations request brief pulses, not a portable intensity setting.
export class InteractionHaptics {
  constructor({ enabled = true, device = globalThis.navigator, page = globalThis.document, now = () => performance.now() } = {}) {
    this.enabled = enabled;
    this.device = device;
    this.page = page;
    this.now = now;
    this.lastPulse = -Infinity;
    this.pulseEnds = 0;
    this.scrubIndex = null;
    this.scrubPointer = null;
  }

  pointerKind(event) {
    if (!event?.isTrusted) return null;
    return event.pointerType || (event.sourceCapabilities?.firesTouchEvents ? "touch" : null);
  }

  pulse(duration, pointer) {
    if (!this.enabled || this.page?.hidden || !["touch", "pen"].includes(pointer)
      || typeof this.device?.vibrate !== "function" || this.device.userActivation?.hasBeenActive === false) return false;
    const time = this.now();
    if (time - this.lastPulse < 50) return false;
    this.lastPulse = time;
    try {
      if (this.device.vibrate(duration) === false) return false;
      this.pulseEnds = time + duration;
      return true;
    } catch { return false; }
  }

  tap(event) { return this.pulse(12, this.pointerKind(event)); }

  beginScrub(index, event) {
    this.endScrub();
    this.scrubIndex = index;
    this.scrubPointer = this.pointerKind(event);
  }

  scrub(index) {
    if (index === this.scrubIndex) return false;
    this.scrubIndex = index;
    // No pulse train for skipped frames: at most one 4ms detent every 50ms.
    return this.pulse(4, this.scrubPointer);
  }

  endScrub() {
    this.scrubIndex = null;
    this.scrubPointer = null;
    if (this.pulseEnds > this.now()) {
      try { this.device?.vibrate?.(0); } catch { /* Best effort cancellation. */ }
    }
    this.pulseEnds = 0;
  }
}
