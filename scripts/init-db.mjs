import fs from "node:fs/promises";
import path from "node:path";
import sql from "mssql";

const root = process.cwd();
const databaseName = process.env.SQLSERVER_DATABASE ?? "PRO_STORE_NEXTJS";
const sharedConfig = {
  user: process.env.SQLSERVER_USER ?? "sa",
  password: process.env.SQLSERVER_PASSWORD ?? "sa@123",
  server: process.env.SQLSERVER_HOST ?? "192.168.1.168",
  port: Number(process.env.SQLSERVER_PORT ?? 1433),
  options: {
    encrypt: process.env.SQLSERVER_ENCRYPT === "true",
    trustServerCertificate: true,
  },
};

function splitStatements(script) {
  return script
    .split(/^\s*GO\s*$/gim)
    .flatMap((batch) => batch.split(/;\s*(?:\r?\n|$)/g))
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function run() {
  const masterPool = await sql.connect({ ...sharedConfig, database: "master" });
  await masterPool
    .request()
    .query(`IF DB_ID('${databaseName}') IS NULL CREATE DATABASE [${databaseName}]`);
  await masterPool.close();

  const appPool = await sql.connect({ ...sharedConfig, database: databaseName });
  const schema = await fs.readFile(path.join(root, "database", "schema.sql"), "utf8");
  const seed = await fs.readFile(path.join(root, "database", "seed.sql"), "utf8");

  const resetStatements = [
    "IF OBJECT_ID('Reviews', 'U') IS NOT NULL DROP TABLE Reviews",
    "IF OBJECT_ID('BlogPosts', 'U') IS NOT NULL DROP TABLE BlogPosts",
    "IF OBJECT_ID('Orders', 'U') IS NOT NULL DROP TABLE Orders",
    "IF OBJECT_ID('Users', 'U') IS NOT NULL DROP TABLE Users",
    "IF OBJECT_ID('Products', 'U') IS NOT NULL DROP TABLE Products",
    "IF OBJECT_ID('Categories', 'U') IS NOT NULL DROP TABLE Categories",
  ];

  for (const statement of resetStatements) {
    await appPool.request().query(statement);
  }

  for (const statement of splitStatements(schema)) {
    await appPool.request().query(statement);
  }

  for (const statement of splitStatements(seed)) {
    await appPool.request().query(statement);
  }

  console.log(`Database ${databaseName} initialized successfully.`);
  await appPool.close();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
