import { describe, expect, it, vi } from "vitest";

import { runLoginActionAndRefresh } from "../src/settings/loginActionRunner";

describe("runLoginActionAndRefresh", () => {
  it("runs request action and refreshes settings view", async () => {
    const plugin = {
      requestLoginCode: vi.fn(async () => undefined),
      verifyLoginCodeAndSaveToken: vi.fn(async () => undefined),
    };
    const refresh = vi.fn();

    await runLoginActionAndRefresh({
      plugin,
      action: "requestLoginCode",
      refresh,
    });

    expect(plugin.requestLoginCode).toHaveBeenCalledTimes(1);
    expect(plugin.verifyLoginCodeAndSaveToken).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("runs verify action and refreshes settings view", async () => {
    const plugin = {
      requestLoginCode: vi.fn(async () => undefined),
      verifyLoginCodeAndSaveToken: vi.fn(async () => undefined),
    };
    const refresh = vi.fn();

    await runLoginActionAndRefresh({
      plugin,
      action: "verifyLoginCodeAndSaveToken",
      refresh,
    });

    expect(plugin.verifyLoginCodeAndSaveToken).toHaveBeenCalledTimes(1);
    expect(plugin.requestLoginCode).not.toHaveBeenCalled();
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("still refreshes settings view when action throws", async () => {
    const plugin = {
      requestLoginCode: vi.fn(async () => {
        throw new Error("boom");
      }),
      verifyLoginCodeAndSaveToken: vi.fn(async () => undefined),
    };
    const refresh = vi.fn();

    await expect(
      runLoginActionAndRefresh({
        plugin,
        action: "requestLoginCode",
        refresh,
      })
    ).rejects.toThrow("boom");

    expect(refresh).toHaveBeenCalledTimes(1);
  });
});
