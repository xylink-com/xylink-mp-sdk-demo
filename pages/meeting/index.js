/**
 * Meeting page demo
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2019-06-01 23:04:27
 */
import XYRTC from '@xylink/xy-mp-sdk';
import { CUSTOM_TEMPLATE } from './template';

Page({
  data: {
    // 麦克风状态
    muted: false,
    // 摄像头状态
    camera: true,
    // 前/后置摄像头
    devicePosition: 'front',
    // 呼叫Loading
    meetingLoading: true,
    // 是否是等候室状态
    onHold: false,

    // 此处没有读取设置页面的值，是因为小程序data值会全局缓存，退出在进入后仍然获取上一次的值，解决办法是在onLoad上重新赋值
    // 指定SDK UI布局模式，可选auto：自动布局 ｜ custom：自定义布局
    template: {
      layout: 'auto',
      detail: [],
    },
    displayName: '',
  },

  /**
   * 页面加载时触发，可以在 onLoad 的参数中获取打开当前页面路径中的参数
   *
   * @param { object } option - 页面URL参数信息
   */
  onLoad(option) {
    this.pageOption = option;
    const layoutMode = wx.getStorageSync('XY_LAYOUT_MODE') || 'auto';
    this.callNumber = wx.getStorageSync('XY_CALL_NUMBER');

    // 自定义布局，设置初始本地Local预览画面和启动推流
    if (layoutMode === 'custom') {
      // 初始页面加载时，获取本地Local数据，做首屏展示
      this.setData({
        template: {
          layout: layoutMode,
          detail: [
            {
              // 最终转换为x: 0vw, y: 0vh, width: 100vw, height: 85vh
              position: [0, 0, 100, 85],
              callNumber: this.callNumber,
              name: this.pageOption.displayName || '',
              quality: 'normal',
              isContent: false,
            },
          ],
        },
      });
    }
  },

  /**
   * 小程序页面初次渲染完成时触发，可以和视图层交互
   */
  async onReady() {
    const { number, password, displayName, videoMute, audioMute } = this.pageOption;

    // XYRTC.createClient()创建了一个单例对象client，在多个小程序页面之间共享一个实例，可以重复调用获取最新的实例；
    this.XYClient = XYRTC.createClient({
      // 目的是排除底部40px空间，显示操作条
      container: { offset: [0, 40, 0, 0] },
    });

    // 发起SDK呼叫，通过回调获取结果
    // 此处请参考API文档，新版本新增其他配置参数
    const response = await this.XYClient.makeCall({
      number,
      password,
      displayName,
    });

    this.onGetCallStatus(response);

    // 设置默认值
    this.setData({
      muted: audioMute === 'true',
      camera: !(videoMute === 'true'),
      devicePosition: 'front',
      displayName,
    });
  },

  /**
   * 呼叫事件回调，通知是否可以进行入会操作
   *
   * 此处有两处逻辑变动：
   * • makeCall方法传递参数发生变化，第一个参数改为了对象，内容不变，第二个参数设置回调函数；
   * • 回调函数中，判断呼叫成功并隐藏CallLoading的逻辑移动到监听事件“connected”中触发，调用组件的start方法移除：
   */
  onGetCallStatus(response) {
    console.log('call response: ', response);
    const { code, message } = response;

    // 最新的逻辑仅需要处理异常呼叫入会即可，其他逻辑不需要再处理
    if (code !== 200) {
      this.XYClient.showToast(message, () => {
        // 退出呼叫页面
        wx.navigateBack({ delta: 1 });
      });
    }
  },

  /**
   * 切换前后置摄像头
   */
  async onSwitchPosition() {
    const position = await this.XYClient.switchCamera();

    this.setData({ devicePosition: position });
  },

  /**
   * 开启/关闭麦克风
   */
  onChangeMuted() {
    this.setData({ muted: !this.data.muted });
  },

  /**
   * 开启/关闭摄像头
   */
  onSwitchCamera() {
    this.setData({ camera: !this.data.camera });
  },

  /**
   * 退出会议界面
   */
  onStopMeeting() {
    // 挂断会议
    this.XYClient.hangup();

    wx.navigateBack({ delta: 1 });
  },

  /**
   * 挂断会议消息
   *
   * 收到此消息可能是因为服务异常、会控挂断、网络断链等情况
   */
  disConnectMeeting(detail) {
    console.log('disConnectMeeting detail:', detail);
    const { message } = detail;

    if (message) {
      // 存在message消息，则直接提示，默认3s后退会会议界面
      // 注意此处的message可以直接用做展示使用，不需要开发者再进行错误码的匹配
      this.XYClient.showToast(message, () => {
        this.onStopMeeting();
      });
    } else {
      // 不存在message消息，直接退会
      this.onStopMeeting();
    }
  },

  /**
   * SDK上报的事件消息
   *
   * @param { object } event - 事件消息内容
   */
  onRoomEvent(event) {
    const { type, detail } = event.detail;

    switch (type) {
      case 'connected':
        // 入会成功消息
        console.log('demo get connected message: ', detail);

        // 隐藏呼叫Loading
        this.setData({ meetingLoading: false });
        break;
      case 'disconnected':
        // 退出会议消息
        console.log('demo get disconnected message: ', detail);

        this.disConnectMeeting(detail);
        break;
      case 'roomChange':
        // live-pusher推流状态消息
        console.log('demo get live-pusher status change message: ', detail);

        break;
      case 'onHold':
        // 被会控移入等候室，当前参会者无法接收到远端的声音和画面，本地画面和声音也无法发送
        console.log('demo get onHold message: ', detail);

        this.setData({ onHold: detail });
        break;
      case 'roster':
        // 参会者列表数据，当有人员变动或者状态变动，会实时推送最新的列表数据
        console.log('demo get roster message: ', detail);

        // 自动布局不需要处理Roster数据
        if (this.data.template.layout !== 'custom') {
          return;
        }

        this.handleCustomLayout(detail);

        break;
      case 'netQualityLevel':
        // 网络质量等级
        console.log('demo get netQualityLevel: ', detail);

        break;
      case 'audioStatus':
        // 推送实时麦克风状态，最新的麦克风状态请以此为准
        console.log('demo get audio status: ', detail);

        this.setData({ muted: detail });
        break;
      case 'confMgmt':
        // 会控消息
        console.log('demo get 会控消息：', detail);

        break;
      case 'eventClick':
        // 画面点击事件
        console.log('demo get eventClick message：', detail);

        break;
      case 'eventLongPress':
        // 画面长按事件
        console.log('demo get eventLongPress message：', detail);

        break;
      case 'eventDoubleClick':
        // 画面双击事件
        console.log('demo get eventDoubleClick message：', detail);

        break;
      case 'speakersInfo':
        // 当前讲话人信息
        console.log('demo get speakersInfo message：', detail);

        break;
      case 'networkParameter':
        // 网络质量等级
        console.log('networkParameter msg:', detail);
        break;
      case 'networkLevel':
        console.log('networkLevel msg:', detail);

        break;
      default: {
        console.log('demo get other message: ', event.detail);
      }
    }
  },

  /**
   * 自定义布局，处理模板计算
   *
   * @param { * } detail - roster事件数据
   */
  handleCustomLayout(detail) {
    // 处理custom模式自定义布局
    const newDetails = [];
    // 获取roster数据
    const roster = detail.rosterV;

    // 最多显示9个画面(包括Local)
    if (roster.length > 8) roster.length = 8;

    const len = roster.length + 1;

    const selfDetailObj = {
      position: CUSTOM_TEMPLATE[len].self,
      callNumber: this.callNumber,
      name: this.pageOption.displayName,
      quality: 'normal',
      isContent: false,
    };

    roster.forEach((item, index) => {
      newDetails.push({
        position: CUSTOM_TEMPLATE[len].other[index].position,
        callNumber: item.callNumber,
        name: item.displayName || '',
        quality: item.isContent ? 'hd' : 'normal',
        isContent: item.isContent,
      });
    });

    // 自己的数据补充到第一位
    newDetails.unshift(selfDetailObj);

    this.setData({
      template: Object.assign({}, this.data.template, {
        detail: newDetails,
      }),
    });
  },
});
