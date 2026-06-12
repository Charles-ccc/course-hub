import assert from "node:assert/strict";
import test from "node:test";
import type { ExecutionContext } from "@nestjs/common";
import { ApiBusinessException } from "../exceptions/api-business.exception";
import { RequestRateLimitGuard } from "./request-rate-limit.guard";

const createContext = (
  method: string,
  originalUrl: string,
  body: Record<string, unknown>,
): ExecutionContext => {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        originalUrl,
        body,
        ip: "127.0.0.1",
        headers: {},
      }),
    }),
  } as unknown as ExecutionContext;
};

test("RequestRateLimitGuard blocks when count exceeds login limit", async () => {
  const store = {
    hit: async () => 21,
  };
  const guard = new RequestRateLimitGuard(store as never);

  await assert.rejects(
    () =>
      guard.canActivate(
        createContext("POST", "/api/v1/auth/phone/login", {
          phone: "13800138001",
        }),
      ),
    (error: unknown) => {
      assert.ok(error instanceof ApiBusinessException);
      assert.equal(error.getStatus(), 429);
      return true;
    },
  );
});

test("RequestRateLimitGuard hashes phone in login key", async () => {
  let capturedKey = "";
  const store = {
    hit: async (key: string) => {
      capturedKey = key;
      return 1;
    },
  };
  const guard = new RequestRateLimitGuard(store as never);

  await guard.canActivate(
    createContext("POST", "/api/v1/auth/phone/login", {
      phone: "13800138001",
    }),
  );

  assert.ok(capturedKey.includes("phone:"));
  assert.equal(capturedKey.includes("13800138001"), false);
});
