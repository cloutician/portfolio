// Keep the middle of the rail direct, then progressively resist the edges.
const DIRECT_TRAVEL_FRACTION = 0.35;

export function lensDragGain(distance, diameter) {
  if (diameter <= 0) return 0.25;
  const radius = diameter / 2;
  // Full strength on the disc, fading to the gentle line response over one radius.
  const progress = Math.max(0, Math.min(1, (distance - radius) / radius));
  return 1 - 0.75 * progress * progress * (3 - 2 * progress);
}

export function resistLensDrag(offset, limit) {
  if (limit <= 0) return 0;
  const distance = Math.abs(offset), free = limit * DIRECT_TRAVEL_FRACTION, soft = limit - free;
  return Math.sign(offset) * (distance <= free
    ? distance : free + soft * (1 - Math.exp(-(distance - free) / soft)));
}

// Re-grabbing a returning lens must not jump on the next pointer movement.
export function unresistLensDrag(offset, limit) {
  if (limit <= 0) return 0;
  const distance = Math.min(Math.abs(offset), limit * (1 - 1e-8));
  const free = limit * DIRECT_TRAVEL_FRACTION, soft = limit - free;
  return Math.sign(offset) * (distance <= free
    ? distance : free - soft * Math.log(1 - (distance - free) / soft));
}

// Exact damped spring: the same small overshoot at 60, 90 or 120 Hz.
export function advanceLensReturn(offset, velocity, seconds) {
  const decay = 13, frequency = Math.sqrt(400 - decay * decay);
  const damping = Math.exp(-decay * seconds);
  const cosine = Math.cos(frequency * seconds), sine = Math.sin(frequency * seconds);
  const coefficient = (velocity + decay * offset) / frequency;
  const position = damping * (offset * cosine + coefficient * sine);
  const speed = damping * ((-decay * offset + frequency * coefficient) * cosine
    + (-decay * coefficient - frequency * offset) * sine);
  const settled = Math.abs(position) < 0.08 && Math.abs(speed) < 0.8;
  return { offset: settled ? 0 : position, velocity: settled ? 0 : speed, settled };
}
