require("dotenv").config({ quiet: true });

const db = require("../database");

const migrate = async () => {
  const [columns] = await db.query(
    "SHOW COLUMNS FROM sparepartsorder LIKE ?",
    ["fulfilledAt"]
  );

  if (columns.length === 0) {
    await db.query(
      "ALTER TABLE sparepartsorder ADD COLUMN fulfilledAt DATETIME NULL AFTER submittedAt"
    );
  }

  await db.query(
    "UPDATE sparepartsorder SET fulfilledAt = submittedAt WHERE status = ? AND fulfilledAt IS NULL",
    ["completed"]
  );

  const [orders] = await db.query(
    "SELECT sparePartsOrderID, status, submittedAt, fulfilledAt FROM sparepartsorder ORDER BY sparePartsOrderID"
  );

  console.log(JSON.stringify({ orders }, null, 2));
};

migrate()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
