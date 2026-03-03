export type LoginSettingAction = "requestLoginCode" | "verifyLoginCodeAndSaveToken";

export interface LoginSettingRow {
  name: string;
  desc: string;
  buttonText: string;
  action: LoginSettingAction;
}

export function getLoginSettingsRows(): LoginSettingRow[] {
  return [
    {
      name: "Boox login",
      desc: "Send code, then immediately enter verification code to save token",
      buttonText: "Send code",
      action: "requestLoginCode",
    },
  ];
}
