# 验证记录

环境：Windows amd64，Go 1.27.3，MyGo 固定依赖版本；上游基线 `1af0d8efd77fdf630c27cfc635f12e9cb089ce10`。

- 插件 JavaScript 测试：4 项通过，包括窄窗口/HD/4K 布局预算、逐词出现、减少动态效果、跳转确定性、换句退出、无歌词与异常 API。
- `go test ./internal/app ./internal/plugin -run TestStage -count=5`：通过。覆盖菜单切换不改变音乐源、恢复内置律动、非法绘制数据、超时、英文词间距与多行元素身份。
- `go tool mygo vet .`：通过。
- `CGO_ENABLED=0` 的 Windows 便携版构建：通过。
- 真实插件通过同一原生绘制函数离线渲染 456 帧（1280×720，24 fps），检查了实际画面，并合成带用户本地音频的 19 秒预览。音频/歌词不随发行包提供。
- `CGO_ENABLED=0 go test ./...`：除 `internal/player` 的 `TestPrevSkipsBack` 外通过。该测试在未修改的上游独立工作树也以相同错误失败（`previous went to c, playing false`），未改动该播放逻辑。

限制：尚未通过桌面 GUI 在用户的真实播放会话里安装并运行；当前验证为原生无窗口 UI 测试及可执行文件构建。预览整句歌词有时间轴，逐词时间是句内估算，不能当作原生逐字同步的验证。
