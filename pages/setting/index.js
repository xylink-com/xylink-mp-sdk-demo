import XYRTC from '@xylink/xy-mp-sdk';
import { defaultServer } from './config';

Page({
  data: {
    server: defaultServer,
    version: '',
    layoutModes: [
      {
        value: 'auto',
        name: '自动布局',
      },
      {
        value: 'custom',
        name: '自定义布局',
      },
    ],
    layoutMode: 'auto',
  },

  onLoad() {
    this.XYClient = XYRTC.getClient();
    const { version, time } = XYRTC.version;
    const versionText = `${version} - ${time}`;
    const layoutMode = wx.getStorageSync('XY_LAYOUT_MODE') || 'auto';
    const server = wx.getStorageSync('XY_SERVER') || defaultServer;

    this.setData({ version: versionText, layoutMode, server });
  },

  // 监听输入
  bindFromInput(e) {
    const value = e.detail.value;

    this.setData({ server: value });
  },

  update() {
    if (!this.data.server) {
      wx.showToast({
        title: '请输入服务器地址',
        icon: 'none',
        duration: 2000,
        mask: true,
      });

      return;
    }

    // xyClient是全局页面共享实例，此处直接设置server值即可
    this.XYClient.setServer(this.data.server);

    wx.setStorageSync('XY_SERVER', this.data.server);

    wx.showToast({
      title: '修改成功',
      icon: 'success',
      duration: 2000,
      mask: true,
    });
  },

  reset() {
    this.setData({ server: defaultServer });
  },

  radioChange(e) {
    const { value = 'auto' } = e.detail || {};

    this.setData({ layoutMode: value });
    wx.setStorageSync('XY_LAYOUT_MODE', value);
  },
});
