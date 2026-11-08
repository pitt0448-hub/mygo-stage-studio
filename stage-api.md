# Stage API 1

这是本项目的本体扩展，不是官方 MyGo Music 已有接口。

清单声明 `stageApi: 1` 和非空 `stageModes: [{id, label}]`，代码导出 `stageFrame(input)`。在律动效果菜单中选中该插件即可替换律动内容区域，播放器的导航、进度条和播放控制保持原样。

## 输入

```js
{
  apiVersion: 1,
  width: 1200, height: 700, // 当前内容区域，逻辑像素
  position: 12345, // 毫秒；所有时间均为毫秒
  playing: true, reduceMotion: false,
  trackId: 'source:id', title: 'Song name', mode: 'cinema',
  accent: [90, 190, 230],
  bands: [/* 24 个 0..1 的频段，低频到高频 */], hasSpectrum: true,
  current: {text:'...', translation:'...', start:10000, end:14000,
    words:[{text:'...',start:10000,end:11000}]},
  next: { /* 同上，无歌词时为 null */ },
  previous: { /* 上一句，用于换句过渡，无时为 null */ }
}
```

输入由主线程复制，工作线程执行插件。同一渲染器最多一个请求在途，频率不超过 30 Hz。下一帧未完成时继续展示上一帧；关闭、切换或禁用后丢弃过期结果。`stageFrame` 调用超时为 250 ms，错误锁定回退；从菜单重新选择可重试。

## 输出

```js
{
  background: [9,13,24,245], // RGBA 整数 0..255；可透明
  primitives: [
    {kind:'text', text:'Hello', x:600,y:300,size:64,weight:600,
      align:'center',color:[255,255,255,255]},
    {kind:'words', x:120,y:400,size:64,weight:500,align:'left',
      runs:[{text:'Hello ',scale:1,opacity:1,rise:0,color:[255,255,255,255]}]},
    {kind:'circle',x:30,y:40,radius:2,color:[90,200,255,100]},
    {kind:'ring',x:600,y:350,radius:180,width:1,color:[90,200,255,80]},
    {kind:'line',x:10,y:10,x2:50,y2:50,width:1,color:[255,255,255,80]},
    {kind:'path',points:[{x:0,y:20},{x:50,y:30}],width:2,color:[90,200,255,80]}
  ]
}
```

`text` 的 y 是顶部，x 按 `align`（left/center/right）对齐。文字总在几何图形之后绘制，以保证可读性；同类图形按顺序覆盖。文字尺寸会取整以限制字形缓存；超出内容区域宽度的整段文字会缩小，其他内容裁切在区域内。不要通过连续改变超长文本制造无限缓存。

`words` 使用原生字体测量保留词间距；每个 run 可以独立指定字号比例（0.5..2）、不透明度（0..1）和纵向位移（-500..500）。字号比例会转成最终字号重新栅格化，而不是拉伸原始文字贴图。

限制：每帧最多 384 个图元、384 个词（单图元最多 160）、4096 个路径点、16384 字节文字；字号 1..320、字重 100..900、线宽 0..128、半径 0..8192；所有坐标必须有限且绝对值不超过 32768。未知图元、越界数据、异常或超时都会回退，不会注入 HTML、执行 Go 或访问原生指针。

`host` 保留现有插件权限语义。此接口不提供额外网络/进程能力。为了让暂停和跳转保持可重复，应以 `position` 驱动动画；不要依赖 `Date.now()`。尊重 `reduceMotion`，无 `hasSpectrum` 时不要声称绘制真实频谱。
