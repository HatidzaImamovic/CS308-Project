require("dotenv").config({ quiet: true });

const db = require("../database");

const hasColumn = async (tableName, columnName) => {
  const [columns] = await db.query(`SHOW COLUMNS FROM ${tableName} LIKE ?`, [
    columnName,
  ]);
  return columns.length > 0;
};

const addColumnIfMissing = async (tableName) => {
  if (await hasColumn(tableName, "orderNumber")) return;

  await db.query(
    `ALTER TABLE ${tableName} ADD COLUMN orderNumber INT NULL AFTER userID`
  );
};

const backfillOrderNumbers = async (tableName, idColumn, dateColumn) => {
  const [orders] = await db.query(
    `SELECT ${idColumn} AS id, userID
     FROM ${tableName}
     ORDER BY userID ASC, ${dateColumn} ASC, ${idColumn} ASC`
  );

  const nextByUser = new Map();

  for (const order of orders) {
    const userID = Number(order.userID);
    const nextNumber = nextByUser.get(userID) || 1;

    await db.query(
      `UPDATE ${tableName} SET orderNumber = ? WHERE ${idColumn} = ?`,
      [nextNumber, order.id]
    );

    nextByUser.set(userID, nextNumber + 1);
  }
};

const makeColumnRequired = async (tableName) => {
  await db.query(`ALTER TABLE ${tableName} MODIFY orderNumber INT NOT NULL`);
};

const migrate = async () => {
  await addColumnIfMissing("serviceorder");
  await addColumnIfMissing("sparepartsorder");

  await backfillOrderNumbers("serviceorder", "serviceOrderID", "createdAt");
  await backfillOrderNumbers(
    "sparepartsorder",
    "sparePartsOrderID",
    "submittedAt"
  );

  await makeColumnRequired("serviceorder");
  await makeColumnRequired("sparepartsorder");

  const [serviceOrders] = await db.query(
    "SELECT serviceOrderID, userID, orderNumber FROM serviceorder ORDER BY userID, orderNumber"
  );
  const [partOrders] = await db.query(
    "SELECT sparePartsOrderID, userID, orderNumber FROM sparepartsorder ORDER BY userID, orderNumber"
  );

  console.log(JSON.stringify({ serviceOrders, partOrders }, null, 2));
};

migrate()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
