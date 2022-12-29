import XYRTC from '@xylink/xy-mp-sdk';
import { DEFAULT_APPID, DEFAULT_EXTID, DEFAULT_SERVER } from '../config';

Page({
  data: {
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
    loginModes: [
      {
        value: 'sdk',
        name: 'SDK企业账号登录',
      },
      {
        value: 'token',
        name: 'Token登录',
      },
    ],
    layoutMode: 'auto',
    loginMode: 'sdk',
    server: DEFAULT_SERVER,
    appId: DEFAULT_APPID,
    extId: DEFAULT_EXTID,
  },
  // 页面加载
  onLoad() {
    this.XYClient = XYRTC.getClient();
    const { version, time } = XYRTC.version;

    const versionText = `${version} - build on ${time}`;

    // 更新历史配置信息
    this.setData({
      version: versionText,
      server: wx.getStorageSync('XY_SERVER') || DEFAULT_SERVER,
      extId: wx.getStorageSync('XY_EXTID') || DEFAULT_EXTID,
      appId: wx.getStorageSync('XY_APPID') || DEFAULT_APPID,
      layoutMode: wx.getStorageSync('XY_LAYOUT_MODE') || 'auto',
      loginMode: wx.getStorageSync('XY_LOGIN_MODE') || 'sdk',
    });
  },

  onReady() {},

  bindFromServerInput(e) {
    this.bindFromInput(e, 'server');
  },

  bindFromExtIdInput(e) {
    this.bindFromInput(e, 'extId');
  },

  bindFromAppIdInput(e) {
    this.bindFromInput(e, 'appId');
  },

  // 监听输入
  bindFromInput(e, key) {
    const value = e.detail.value;

    this.setData({ [key]: value });
  },

  // 更新服务域名、APPID、EXTID信息
  update() {
    if (!this.data.server) {
      this.XYClient.showToast('请输入服务器地址');
      return;
    }

    this.XYClient.setServer(this.data.server);
    this.XYClient.showToast('修改成功');

    // 存储下来，后续读取此配置
    wx.setStorageSync('XY_APPID', this.data.appId);
    wx.setStorageSync('XY_EXTID', this.data.extId);
    wx.setStorageSync('XY_SERVER', this.data.server);
  },

  /**
   * 重新配置信息
   */
  reset() {
    this.setData({
      server: DEFAULT_SERVER,
      appId: DEFAULT_APPID,
      extId: DEFAULT_EXTID,
    });
  },

  /**
   * 更新布局模式
   */
  radioChange(e) {
    const { value = 'auto' } = e.detail || {};

    this.setData({ layoutMode: value });
    wx.setStorageSync('XY_LAYOUT_MODE', value);
  },

  /**
   * 更新登录模式
   */
  loginChange(e) {
    const { value = 'sdk' } = e.detail || {};

    this.setData({ loginMode: value });
    wx.setStorageSync('XY_LOGIN_MODE', value);
  },
});
