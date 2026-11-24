const { test } = require("node:test");
const assert = require("node:assert/strict");
const cacheService = require("../src/services/cacheService");

test("cacheService stores, retrieves, and expires in-memory entries", async () => {
  await cacheService.set("test:key", { message: "hello" }, 2);
  const value = await cacheService.get("test:key");
  assert.deepEqual(value, { message: "hello" });

  await cacheService.del("test:key");
  const deleted = await cacheService.get("test:key");
  assert.equal(deleted, null);
});

test("cacheService deletes by prefix correctly", async () => {
  await cacheService.set("prefix:1", "a", 10);
  await cacheService.set("prefix:2", "b", 10);
  await cacheService.set("other:1", "c", 10);

  await cacheService.delPrefix("prefix:");
  assert.equal(await cacheService.get("prefix:1"), null);
  assert.equal(await cacheService.get("prefix:2"), null);
  assert.equal(await cacheService.get("other:1"), "c");
});
