import { describe, expect, it } from "vitest";

import { getLoginSettingsRows } from "../src/settings/loginConfig";

describe("getLoginSettingsRows", () => {
  it("returns one compact login action row and no standalone verify row", () => {
    const rows = getLoginSettingsRows();

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      name: "Boox login",
      desc: "Send code, then immediately enter verification code to save token",
      buttonText: "Send code",
      action: "requestLoginCode",
    });
    expect(rows.some((item) => item.action === "verifyLoginCodeAndSaveToken")).toBe(false);
  });
});
