/**
 * Pluralizes a movement if it starts with a number
 * Example: "20 RMU" -> "20 RMUs"
 * Example: "10 Deadlift" -> "10 Deadlifts"
 * Example: "20 Wall Ball 30lbs" -> "20 Wall Balls 30lbs"
 * Example: "RMU" -> "RMU" (no change if no number)
 */
export function pluralizeMovement(movement: string): string {
  // Match pattern: number(s) followed by space, then movement text
  const match = movement.match(/^(\d+)\s+(.+)$/);
  
  if (match) {
    const number = match[1];
    const rest = match[2].trim();
    
    // Don't pluralize if it already ends with 's' (might be plural already)
    if (rest.toLowerCase().endsWith('s')) {
      return movement; // Already plural
    }
    
    // Split by spaces to find the movement name (usually the first word or two)
    // Common pattern: "Wall Ball 30lbs" -> pluralize "Wall Ball" -> "Wall Balls"
    const parts = rest.split(/\s+/);
    
    // If there's a weight/unit at the end (like "30lbs", "20kg", etc.), don't pluralize that
    // Otherwise, pluralize the last word that's not a number
    let movementName = '';
    let suffix = '';
    
    // Check if last part looks like a weight/unit (contains numbers and units like lbs, kg, etc.)
    const lastPart = parts[parts.length - 1];
    const hasWeightUnit = /\d+(lbs?|kg|lb|oz|#)/i.test(lastPart);
    
    if (hasWeightUnit && parts.length > 1) {
      // Has weight/unit, pluralize everything except the last part
      movementName = parts.slice(0, -1).join(' ');
      suffix = lastPart;
    } else {
      // No weight/unit, pluralize the whole thing
      movementName = rest;
    }
    
    // Don't pluralize if already ends with 's'
    if (movementName.toLowerCase().endsWith('s')) {
      return movement;
    }
    
    // Pluralize the movement name
    const pluralized = suffix 
      ? `${number} ${movementName}s ${suffix}`
      : `${number} ${movementName}s`;
    
    return pluralized;
  }
  
  // No number prefix, return as-is
  return movement;
}

/**
 * Pluralizes an array of movements
 */
export function pluralizeMovements(movements: string[]): string[] {
  return movements.map(pluralizeMovement);
}

