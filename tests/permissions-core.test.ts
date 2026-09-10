import assert from "node:assert/strict";
import test from "node:test";
import { canAccessAction, canAccessModule, canAccessPath, hasPermission } from "../lib/permissions-core.ts";

test("detaylı izin bir modül erişimini açar", () => {
  assert.equal(canAccessModule(["screenings.detail"], "/taramalar"), true);
  assert.equal(canAccessModule(["screenings.detail"], "/teklifler"), false);
});

test("detay sayfaları kendi modül erişimini kullanır", () => {
  assert.equal(canAccessModule(["companies.detail"], "/firmalar/12"), true);
  assert.equal(canAccessModule(["companies.detail"], "/personeller/12"), false);
});

test("eski rol izinleri geriye dönük çalışır", () => {
  assert.equal(canAccessModule(["Taramalar"], "/taramalar"), true);
  assert.equal(canAccessModule(["Taramalar"], "/firmalar"), false);
});

test("ayarlar erişimi ayar izinlerinden hesaplanır", () => {
  assert.equal(canAccessModule(["settings.roles"], "/ayarlar"), true);
  assert.equal(canAccessModule(["screenings.list"], "/ayarlar"), false);
});

test("işlem izni yalnızca kendisi seçiliyse geçerlidir", () => {
  assert.equal(hasPermission(["screenings.detail", "screenings.list"], "screenings.detail"), true);
  assert.equal(hasPermission(["screenings.detail"], "screenings.create"), false);
});

test("detay izni oluşturma rotasına erişim vermez", () => {
  assert.equal(canAccessAction(["screenings.detail"], "screenings.create"), false);
  assert.equal(canAccessPath(["screenings.detail"], "/taramalar/42"), true);
  assert.equal(canAccessPath(["screenings.detail"], "/taramalar/yeni"), false);
});

test("sonuçlar modülü kendi liste ve Excel izinlerini ayırır", () => {
  assert.equal(canAccessPath(["results.list"], "/sonuclar"), true);
  assert.equal(canAccessAction(["results.list"], "results.export"), false);
});
