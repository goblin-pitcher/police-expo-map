## 全景页面识别

> ​		分支项目算法识别全景地图中的车辆、交通标志、广告等内容，演示时浏览器最小化，或切换到其他tab页时，算法容易将桌面或其他页面内容识别成广告。
>
> ​		算法来不及改进，因此在演示机器浏览器上安装插件，识别是否在操作地图，若没有操作地图，发送消息至服务器，通知前端播放器停止绘制结构化信息，由于视频流的延迟，popup页可进行请求延迟发送相关配置。。

​		主要通过监听`windows.onFocusChanged`、`tabs.onActivated`和`tabs.onUpdated`事件，分别浏览器最小化、在tab切换和页面更新时进行url的判断。
  通过`dataWatcher`方法生成的更新参数方法，对状态的变化进行管理。。
