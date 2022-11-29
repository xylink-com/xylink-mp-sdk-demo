# 小鱼易连-小程序 SDK Demo 演示

### 文档

在这里查阅 sdk 文档：[文档](https://openapi.xylink.com/common/meeting/api/description?platform=miniprogram)

### 准备工作

1. 计算并获取 token，用户登录接口使用，参见[文档](https://openapi.xylink.com/common/meeting/doc/miniprogram_server?platform=miniprogram)
2. 将获取到的 token 在`/pages/index/index.js`中进行配置。
3. 因为运行小程序，需要小程序所对应的 appid 进行一定的配置，具体的配置参考下面的连接：[运行环境配置](https://openapi.xylink.com/common/meeting/doc/run_demo?platform=miniprogram#h0613ccc-WVyQKxZj)

### 运行

1. 通过 git clone 此项目或者下载 zip 包到本地';
2. `yarn`或者`npm install`;
3. 用微信开发者工具打开此项目，并配置 appid;
4. 在工具中执行：工具->构建 npm;
5. 执行编译并预览;
6. 填写 Token、会议号、用户名称加入会议;

### Note

1. 使用 Node >= 14.17 版本;
2. 微信开发者工具不支持推拉流，请使用真机调试音视频;
3. 此 Demo 包含 auto 和 custom 模式;
