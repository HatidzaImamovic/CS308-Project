// Temporary debug helper to call the backend to delete all orders for a user.
// Usage: node _debug_clear_orders.js <userID>

const fetch = require("node-fetch");
const userId = process.argv[2];
if (!userId) {
  console.error("Usage: node _debug_clear_orders.js <userID>");
  process.exit(1);
}

const API_URL = "http://localhost:3000";

(async () => {
  try {
    const res = await fetch(`${API_URL}/serviceorders/user/${userId}`, {
      method: "DELETE",
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("Error:", body);
      process.exit(2);
    }
    console.log("Deleted orders:", body);
  } catch (err) {
    console.error("Fetch error:", err.message);
    process.exit(3);
  }
})();
