export function formatDate(ts) {
  if (!ts) return "—";

  try {
    const date =
      ts?.seconds
        ? new Date(ts.seconds * 1000) // Firestore Timestamp
        : new Date(ts);               // clientCreatedAt (number)

    return date.toLocaleString("en-US", {
      weekday: "short",   // Mon
      month: "short",     // Jan
      day: "numeric",     // 27
      year: "numeric",    // 2026
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (err) {
    console.error("formatDate error:", err);
    return "—";
  }
}
