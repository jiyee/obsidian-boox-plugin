# Boox Highlights Sync

Boox Highlights Sync 是一个 Obsidian 社区插件，用于把 Boox 里的书籍划线与笔记同步到你的 Obsidian Vault，自动生成 Markdown 笔记，方便二次整理与长期沉淀。

## 更新历史

- Releases: https://github.com/jiyee/obsidian-boox-plugin/releases

## 功能

- 同步 Boox 书籍划线与笔记到 Obsidian
- 按书籍生成并维护 Markdown 笔记（一本书一个文件）
- 首次全量同步，后续按增量更新（有变化才更新）
- 同步过程支持取消
- 同步结果支持查看报告（成功/跳过/失败统计 + 详细日志）
- 支持命令面板、Ribbon 图标、设置页按钮触发同步
- 支持启动 Obsidian 后自动同步（可选）
- 支持移动端（`isDesktopOnly: false`）

## 安装

### 方式一：Obsidian 社区插件市场（如果可搜索到插件）

1. 打开 **Settings → Community plugins**。
2. 搜索 `Boox Highlights Sync`。
3. 点击 **Install**，安装后点击 **Enable**。
4. 如果搜索不到插件，请使用“方式二：手动安装”。

### 方式二：手动安装（推荐给测试版用户）

1. 从 release 下载以下文件：
   - `main.js`
   - `manifest.json`
   - `styles.css`
2. 拷贝到你的 Vault 目录：

```text
<Vault>/.obsidian/plugins/obsidian-boox-plugin/
```

3. 打开 Obsidian，在 **Settings → Community plugins** 中启用插件。

## 配置

进入 **Settings → Boox Highlights Sync**，主要配置如下：

- `Send2boox host`
  - 默认 `send2boox.com`，海外用户填写 `eur.boox.com` 或者 `us.boox.com`，一般不需要修改。
- `Account`
  - 你的 Boox 登录邮箱或手机号。
- `Boox login` / `Send code`
  - 一体化登录按钮：
  - 点击后先输入账号并发送验证码，然后会自动弹出验证码输入框；
  - 验证成功后，`SEND2BOOX_TOKEN` 会自动更新。
- `Auth token`（`SEND2BOOX_TOKEN`）
  - 你也可以手动粘贴 token。
- `Highlights folder`
  - 同步文件保存目录，默认 `Boox Highlights`。
- `Include inactive`
  - 是否包含已归档/已删除的记录。
- `Sync on startup`
  - 开启后，Obsidian 启动后会自动触发一次同步。

## 使用

### 基础同步

1. 完成登录（建议在设置页点 `Send code` 一步完成）。
2. 执行以下任一方式触发同步：
   - 左侧 Ribbon 按钮
   - 命令面板（`Cmd/Ctrl + P`）
   - 设置页 `Sync now`

### 查看同步结果

- 同步结束后会弹出摘要通知。
- 若有失败或取消，可查看详细报告（含逐书错误与可复制日志）。

## 命令列表

- `Sync boox highlights and notes`
- `Request boox login code`
- `Verify boox code and save token`（兜底入口）
- `Cancel boox sync`
- `Show last boox sync report`

## 同步规则说明

- 同步方向：`Boox -> Obsidian`（单向）
- 文件组织：一本书对应一个 Markdown 文件
- 识别方式：通过 frontmatter 中的 `boox-book-id` 定位同一本书
- 更新策略：增量更新（基于上次同步时间 + 注释更新时间）
- 写入策略：同一本书的内容会被同步结果覆盖更新

## 常见问题

### 1. 登录后 token 没更新到输入框？

- 当前版本在登录流程结束后会自动刷新设置页并更新 `SEND2BOOX_TOKEN`。
- 若仍未更新，请关闭并重新打开插件设置页后重试。

### 2. 同步失败提示网络错误怎么办？

- 先确认网络可访问 `send2boox.com`。
- 重新执行一次同步。
- 如 token 失效，重新登录获取新 token。

### 3. 为什么有些书被跳过？

- 该书没有划线/笔记，或自上次同步以来没有变化。

### 4. 取消同步后为什么还有少量写入？

- 取消在“书籍粒度”生效：当前正在处理的书会完成后停止。

## 注意事项

- 本插件是同步型更新，建议不要直接手改插件生成的同步内容。
- 推荐在其他笔记中通过链接或引用方式做二次整理。

## 隐私与安全

- 插件仅在你主动同步/登录时请求 Boox 相关接口。
- 不包含隐藏遥测。
- 不会上传你的整库笔记内容。

## 感谢

- [Kindle Highlights](https://github.com/hadynz/obsidian-kindle-plugin)

## 免责声明

本插件仅用于同步你本人账号下可访问的划线与笔记数据，请遵守相关平台的使用条款与版权规范。
