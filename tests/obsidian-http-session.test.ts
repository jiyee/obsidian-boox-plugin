import { describe, expect, it } from "vitest";

import type { RequestUrlLike } from "../src/boox/obsidianHttpSession";
import { createObsidianHttpSession } from "../src/boox/obsidianHttpSession";

type FakeResponse = {
  status: number;
  headers: Record<string, string>;
  arrayBuffer: ArrayBuffer;
  json: unknown;
  text: string;
};

describe("createObsidianHttpSession", () => {
  it("builds request url and forwards cookie/auth headers", async () => {
    const calls: Parameters<RequestUrlLike>[0][] = [];
    const requestUrl: RequestUrlLike = async (request): Promise<FakeResponse> => {
      calls.push(request);
      return {
        status: 200,
        headers: {},
        arrayBuffer: new ArrayBuffer(0),
        json: { ok: true },
        text: '{"ok":true}',
      };
    };

    const session = createObsidianHttpSession(requestUrl);
    session.cookies.setCookie({
      name: "session_id",
      value: "session-123",
      domain: "send2boox.com",
      path: "/",
      secure: true,
    });

    const response = await session.request({
      method: "GET",
      url: "https://send2boox.com/neocloud/_changes",
      params: {
        since: 0,
        limit: 1000,
      },
      headers: {
        Authorization: "Bearer token-123",
      },
      timeoutSeconds: 1,
    });

    expect(calls).toHaveLength(1);
    const firstCall = calls[0];
    if (!firstCall) {
      throw new Error("Expected one request call.");
    }

    expect(firstCall.url).toContain("https://send2boox.com/neocloud/_changes?");
    expect(firstCall.url).toContain("since=0");
    expect(firstCall.url).toContain("limit=1000");
    expect(firstCall.headers?.Authorization).toBe("Bearer token-123");
    expect(firstCall.headers?.Cookie).toContain("session_id=session-123");

    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it("returns json parse error when body is not valid json", async () => {
    const requestUrl: RequestUrlLike = async (): Promise<FakeResponse> => ({
      status: 200,
      headers: {},
      arrayBuffer: new ArrayBuffer(0),
      json: "not-json",
      text: "not-json",
    });

    const session = createObsidianHttpSession(requestUrl);
    const response = await session.request({
      method: "GET",
      url: "https://send2boox.com/api/1/users/me",
      timeoutSeconds: 1,
    });

    await expect(response.json()).rejects.toThrow();
  });
});
