/**
 * 小鱼易连SDK示例程序-加入会议
 *
 * Created at     : 2022-11-16 19:51:33
 * Last modified  : 2022-11-29 23:36:37
 */

// import xylink from 'xylink-sdk/common/room.js';
import XYRTC from '@xylink/xy-mp-sdk';
import { showToast } from '../../utils/index';

const app = getApp();

Page({
  data: {
    meeting: {
      number: '',
      password: '',
      displayName: '',
      // 创建Token，详见文档：https://openapi.xylink.com/common/meeting/doc/miniprogram_server?platform=miniprogram
      token: '',
    },
    version: '',
  },

  /**
   * 页面加载完成回调，初始化小鱼小程序SDK，创建SDK实例
   */
  onLoad() {
    const { version, time } = XYRTC.version;
    this.setData({ version: `v${version} - ${time}` });

    // XYRTC.createClient()创建了一个单例对象client，在多个小程序页面之间共享一个实例，可以重复调用获取最新的实例；
    this.XYClient = XYRTC.createClient();
  },

  /**
   * 登录&加入会议
   */
  onJoin() {
    const { token } = this.data.meeting;

    if (!token) {
      showToast('请填写Token');
      return;
    }

    // 获取Token参见文档： https://openapi.xylink.com/common/meeting/doc/miniprogram_server?platform=miniprogram#h0613ccc-jN2Ef3V7
    // 第一步：登录
    this.XYClient.login(token, this.onCallbackGetNumber);
  },

  /**
   * SDK登录回调函数
   *
   * @param { * } res - 登录回调结果
   */
  onCallbackGetNumber(res) {
    // 状态是200时，初始化登录成功
    console.log('login callback: ', res);

    if (res.code === 200) {
      // 将登录得到的用户信息存储到本地，会议页面可能需要用到
      wx.setStorageSync('XY_User_Info', res.data);

      this.callNumber = res.data.callNumber;

      // 登录成功后，开始加入会议
      this.joinMeeting();
    } else {
      showToast('登录失败，请检查');
    }
  },

  /**
   * 监听输入
   */
  bindFromInput(e) {
    const type = e.target.id;
    const value = e.detail.value;

    this.setData({ meeting: { ...this.data.meeting, [type]: value } });
  },

  /**
   * 加入会议
   */
  joinMeeting() {
    const { displayName, password, number } = this.data.meeting;

    if (!this.callNumber || !number) {
      showToast('请检查入会参数');
      return;
    }

    // 跳转会议页面
    wx.navigateTo({
      url: `/pages/meeting/index?displayName=${displayName}&password=${password}&number=${number}`,
    });
  },

  /**
   * 设置
   */
  switchSetting() {
    wx.navigateTo({ url: '/pages/setting/index' });
  },
});
