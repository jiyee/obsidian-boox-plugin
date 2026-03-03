import type { LoginSettingAction } from "./loginConfig";

type LoginActionPlugin = {
  requestLoginCode(): Promise<void>;
  verifyLoginCodeAndSaveToken(): Promise<void>;
};

export async function runLoginActionAndRefresh(options: {
  plugin: LoginActionPlugin;
  action: LoginSettingAction;
  refresh: () => void;
}): Promise<void> {
  try {
    if (options.action === "requestLoginCode") {
      await options.plugin.requestLoginCode();
      return;
    }

    await options.plugin.verifyLoginCodeAndSaveToken();
  } finally {
    options.refresh();
  }
}
