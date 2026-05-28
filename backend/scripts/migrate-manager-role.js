require("dotenv").config({ quiet: true });

const bcrypt = require("bcrypt");
const db = require("../database");

const quote = (value) => `'${value.replace(/'/g, "''")}'`;
const enumType = (values) => `ENUM(${values.map(quote).join(",")})`;

const oldAndNewRoles = [
  "technician",
  "manager",
  "warehouse",
  "",
  "menadžer",
  "serviser",
  "skladištar",
];

const localizedRoles = ["menadžer", "serviser", "skladištar"];

const migrate = async () => {
  await db.query(
    `ALTER TABLE user MODIFY role ${enumType(oldAndNewRoles)} NOT NULL`
  );

  await db.query("UPDATE user SET role = ? WHERE role = ?", [
    "menadžer",
    "manager",
  ]);
  await db.query("UPDATE user SET role = ? WHERE role = ?", [
    "serviser",
    "technician",
  ]);
  await db.query("UPDATE user SET role = ? WHERE role = ?", [
    "skladištar",
    "warehouse",
  ]);
  await db.query("UPDATE user SET role = ? WHERE role = ?", ["serviser", ""]);

  await db.query("UPDATE user SET role = ? WHERE username = ?", [
    "serviser",
    "testtest",
  ]);

  const passwordHash = await bcrypt.hash("manager123", 10);
  const [existingManagers] = await db.query(
    "SELECT userID FROM user WHERE username = ?",
    ["manager"]
  );

  if (existingManagers.length > 0) {
    await db.query(
      "UPDATE user SET fName = ?, lName = ?, email = ?, password = ?, role = ? WHERE username = ?",
      ["Manager", "User", "manager@example.com", passwordHash, "menadžer", "manager"]
    );
  } else {
    await db.query(
      "INSERT INTO user (fName, lName, username, email, password, role) VALUES (?, ?, ?, ?, ?, ?)",
      ["Manager", "User", "manager", "manager@example.com", passwordHash, "menadžer"]
    );
  }

  await db.query(
    `ALTER TABLE user MODIFY role ${enumType(localizedRoles)} NOT NULL`
  );

  const [columns] = await db.query("SHOW COLUMNS FROM user LIKE ?", ["role"]);
  const [users] = await db.query(
    "SELECT userID, username, role FROM user ORDER BY userID ASC"
  );

  console.log(
    JSON.stringify(
      {
        roleColumn: columns[0]?.Type,
        users,
      },
      null,
      2
    )
  );
};

migrate()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.end();
  });
