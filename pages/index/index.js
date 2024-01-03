/**
 * 小程序示例 首页
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2018-12-29 17:26:35
 */

import XYRTC from '@xylink/xy-mp-sdk';
import { DEFAULT_SERVER, DEFAULT_EXTID, DEFAULT_APPID } from '../config';

Page({
  data: {
    version: '',
    // 入会信息
    meeting: {
      number: '9035105641',
      password: '',
      name: 'mp',
    },
    // SDK企业登录信息
    externalLogin: {
      extUserId: '',
      displayName: '',
    },
    // Token登录信息
    token: '',
    // 是否关闭摄像头入会
    videoMute: false,
    // 是否关闭麦克风入会
    audioMute: false,
    // 登录方式：SDK企业账号登录、Token登录，推荐使用SDK企业账号登录，更方便
    loginMode: 'sdk',
    //登录状态
    loginStatus: false,
  },
  onLoad() {
    const { version, time } = XYRTC.version;
    const versionText = `${version} - build on ${time}`;

    this.setData({ version: versionText });

    this.initSDK();
  },

  // 设置页面配置项可能改动，重新回到首页，重新初始化SDK
  onShow() {
    // 配置项改动后需要重新弄登录
    const callNumber = wx.getStorageSync('XY_CALL_NUMBER');
    if(!callNumber){
      this.logout()
    }else{
      this.setData({loginStatus:true})
    }
    const loginMode = wx.getStorageSync('XY_LOGIN_MODE') || 'sdk';

    this.setData({ loginMode });
    this.initSDK();
  },

  initSDK() {
    const server = wx.getStorageSync('XY_SERVER') || DEFAULT_SERVER;
    const extId = wx.getStorageSync('XY_EXTID') || DEFAULT_EXTID;
    const appId = wx.getStorageSync('XY_APPID') || DEFAULT_APPID;

    this.XYClient = XYRTC.createClient({ report: true, extId, appId });
    // 可选执行，设置SDK服务域名，默认可不需要调用
    this.XYClient.setServer(server);
  },

  /**
   * SDK两种登录方式：SDK企业账号登录、Token登录
   *
   * 建议使用SDK企业账号登录，使用方便，无需和服务打交道
   */
  async login() {
    const { externalLogin, loginMode, token } = this.data;

    // SDK企业账号登录
    if (loginMode === 'sdk') {
      const response = await this.XYClient.loginExternalAccount(externalLogin);

      this.onGetCallNumber(response);
    } else if (loginMode === 'token') {
      // Token登录号
      // 此处第三方开发者需要自行与服务器交互，获取Token
      // 具体参见接口文档： https://openapi.xylink.com/common/meeting/doc/miniprogram_server?platform=miniprogram
      const response = await this.XYClient.login(token);

      this.onGetCallNumber(response);
    }
  },

  // 退出登录
  logout(){
    wx.setStorageSync('XY_CALL_NUMBER', '');
    this.setData({
      loginStatus:false, 
        externalLogin: {
        extUserId: '',
        displayName: '',
      },
    token:''})
  },

  switchEnv() {
    wx.navigateTo({ url: '/pages/setting/index' });
  },

  // 执行初始化登录回调函数
  onGetCallNumber(response) {
    console.log('login response:', response);
    // 状态是200时，初始化登录成功
    if (response.code === 200 || response.code === 'XYSDK:980200') {
      const cn = response.data.callNumber;

      wx.setStorageSync('XY_CALL_NUMBER', cn);
      this.setData({loginStatus:true})
      this.XYClient.showToast('登录成功');
    } else {
      this.XYClient.showToast('登录失败，请稍后重试');
    }
  },

  changeVideo(e) {
    const { value } = e.detail;

    this.setData({ videoMute: !!value });
  },

  changeAudio(e) {
    const { value } = e.detail;
    this.setData({ audioMute: !!value });
  },

  /**
   * 加入会议
   */
  onJoinMeeting() {
    // 没有callNumber，则需要进行login操作
    const callNumber = wx.getStorageSync('XY_CALL_NUMBER');

    // 如果本地没有callNumber字段，则认为没有登录操作。需要提示进行初始化登录
    if (!callNumber) {
      this.XYClient.showToast('请先登录');
      return;
    }

    const { name, password, number } = this.data.meeting;
    const { videoMute, audioMute } = this.data;

    if (!number) {
      this.XYClient.showToast('会议号不能为空');
      return;
    }
    if(!name){
      this.XYClient.showToast('入会名称不能为空');
      return;
    }

    wx.navigateTo({
      url: `/pages/meeting/index?displayName=${name}&password=${password}&number=${number}&videoMute=${videoMute}&audioMute=${audioMute}`,
    });
  },

  /**
   * 入会信息
   */
  bindFromInput(e) {
    const type = e.target.id;
    const value = e.detail.value;

    this.setData({ meeting: { ...this.data.meeting, [type]: value } });
  },

  /**
   * 清除会议号
   */
  clearMeetingNum(){
    this.setData({ meeting: { ...this.data.meeting, number: '' } });
  },

  /**
   * Token登录
   */
  bindFromTokenInput(e) {
    const value = e.detail.value;

    this.setData({ token: value });
  },

  /**
   * SDK企业登录信息
   */
  bindFromExternalInput(e) {
    const nextData = Object.assign({}, this.data.externalLogin, {
      [e.target.id]: e.detail.value,
    });

    this.setData({ externalLogin: nextData });
  },
});
