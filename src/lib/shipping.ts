/**
 * Calculates the next shipping day based on a 14:00 cutoff and Mon-Fri business days.
 * @returns {string} The shipping day message (e.g., "Bugün", "Pazartesi", "Yarın (Salı)")
 */
export function getNextShippingDay(): string {
    const now = new Date();
    // For testing/development, you can offset 'now' if needed
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    const hour = now.getHours();
    const cutoff = 14;

    // Days of the week in Turkish
    const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

    // 1. Weekends
    if (day === 0) return "Pazartesi"; // Sunday -> Monday
    if (day === 6) return "Pazartesi"; // Saturday -> Monday

    // 2. Friday after cutoff
    if (day === 5 && hour >= cutoff) return "Pazartesi";

    // 3. Weekdays before cutoff
    if (hour < cutoff) return "Bugün";

    // 4. Weekdays after cutoff (Mon-Thu)
    // Return "Yarın (DayName)"
    const nextDay = (day + 1) % 7;
    return `Yarın (${dayNames[nextDay]})`;
}
