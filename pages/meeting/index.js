/**
 * Meeting page demo
 *
 * @authors Luo-jinghui (luojinghui424@gmail.com)
 * @date  2019-06-01 23:04:27
 */
import XYRTC from '@xylink/xy-mp-sdk';
import {CUSTOM_TEMPLATE} from './template';
import {audioUnmuteIcon, audioMuteIcon, handUpIcon,handDownIcon,DEVICE_TYPE_MAP} from './configData'

const currentTime = Math.round(new Date().getTime() / 1000);

Page ({
  data: {
    // 等候室麦克风状态
    holdAudioMuted:false,
    // 等候室摄像头状态
    holdCamera:false,
    // 当前设备ID
    localCallUri:'',
    // 共享信息
    content:{},
    // 麦克风状态
    audioMuted:false,
    // 举手状态
    handStatus: false,
    // 强制静音
    disableMute: false,
    // 麦克风图标
    audioData: {},
    // 摄像头状态
    camera: true,
    // 前/后置摄像头
    devicePosition: 'front',
    // 呼叫Loading
    meetingLoading: true,
    // 是否是等候室状态
    onHold: false,
    // 本地网络信号等级
    localNetworkLevel: 4,
    // 会议时长
    meetingTime: '',
    // 会议邀请信息显示状态
    inviteInfoShow: false,
    // 会议号
    meetingNum:'',
    // 会议信息
    meetingInfo: {},
    // 参会者显示状态
    rosterShow: false,
    // 参会者人数
    total: 0,
    //参会者列表
    rosterList: [],
    // 展示的参会者列表
    filterRosterList: [],
    searchTimer: '',
    // 搜索关键字
    searchVal: '',
    // 网络显示状态
    netInfoShow: false,
    // 参会者质量
    netInfoDetail: {
      detectionList: [{type: '发送'}, {type: '接收'}],
      memberList: [],
    },
    // 双击计时器
    timeStamp: 0,
    //网络信息表头
    tableHeader: {
      networkDetection: ['通道名称', '带宽', '抖动(ms)'],
      member: ['参会者名称', '分辨率', '帧率(fps)', '音频码率(kbps)', '网络质量'],
    },
    // 此处没有读取设置页面的值，是因为小程序data值会全局缓存，退出在进入后仍然获取上一次的值，解决办法是在onLoad上重新赋值
    // 指定SDK UI布局模式，可选auto：自动布局 ｜ custom：自定义布局
    template: {
      layout: 'auto',
      detail: [],
    },
    displayName: '',
    // 控制操作栏是否显示
    showOperateBar: true, 
    // 操作条点击时间
    operateTimmer:currentTime,
    // 定时器
    operateBarTimmer:''
  },

  /**
   * 页面加载时触发，可以在 onLoad 的参数中获取打开当前页面路径中的参数
   *
   * @param { object } option - 页面URL参数信息
   */
  onLoad (option) {
    this.pageOption = option;
    const layoutMode = wx.getStorageSync ('XY_LAYOUT_MODE') || 'auto';
    this.callNumber = wx.getStorageSync ('XY_CALL_NUMBER');

    // 自定义布局，设置初始本地Local预览画面和启动推流
    if (layoutMode === 'custom') {
      // 初始页面加载时，获取本地Local数据，做首屏展示
      this.setData ({
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
  async onReady () {
    const {
      number,
      password,
      displayName,
      videoMute,
      audioMute,
    } = this.pageOption;

    // XYRTC.createClient()创建了一个单例对象client，在多个小程序页面之间共享一个实例，可以重复调用获取最新的实例；
    this.XYClient = XYRTC.createClient ({
      // 目的是排除底部40px空间，显示操作条
      container: {offset: [0, 40, 0, 0]},
      report: true,
    });

    // 配置-获取邀请链接，参会者头像
    this.XYClient.setFeatureConfig ({
      enableLayoutAvatar: true,
      enableMeetingInvite: true,
    });

    // this.XYClient.setDebug(true, true);
   
    // 发起SDK呼叫，通过回调获取结果
    // 此处请参考API文档，新版本新增其他配置参数
    const response = await this.XYClient.makeCall ({
      number,
      password,
      displayName,
    });

    this.onGetCallStatus (response);
    // 设置默认值
    this.setData ({
      audioMuted:audioMute === 'true',
      camera: !(videoMute === 'true'),
      devicePosition: 'front',
      meetingNum:number,
      displayName,
    });
    this.muteStatus ();
  },

  /**
   * 呼叫事件回调，通知是否可以进行入会操作
   *
   * 此处有两处逻辑变动：
   * • makeCall方法传递参数发生变化，第一个参数改为了对象，内容不变，第二个参数设置回调函数；
   * • 回调函数中，判断呼叫成功并隐藏CallLoading的逻辑移动到监听事件“connected”中触发，调用组件的start方法移除：
   */
  onGetCallStatus (response) {
    console.log ('call response: ', response);
    const {code, message} = response;
    // 隐藏呼叫Loading
    this.setData ({meetingLoading: false});
    // 最新的逻辑仅需要处理异常呼叫入会即可，其他逻辑不需要再处理
    if (code !== 200) {
      this.XYClient.showToast (message, () => {
        // 退出呼叫页面
        wx.navigateBack({ delta: 1 });
      });
    }
  },

  /**
   * 切换前后置摄像头
   */
  async onSwitchPosition () {
    const position = await this.XYClient.switchCamera ();
    this.setData ({devicePosition: position});
    this.resetOperateBarTimmer();
  },
/**
   * 切换等候室摄像头状态
   */
  async onSwitchholdCamera(){
    this.setData ({holdCamera: !this.data.holdCamera});
  },
/**
   * 切换等候室麦克风状态
   */
  async onSwitchHandAudio(){
    this.setData ({holdAudioMuted: !this.data.holdAudioMuted});
  },

  /**
   * 举手，开启/关闭麦克风
   */
  onChangeMuted () {
    switch (this.data.audioData.type) {
      case 'mute':
        this.setData({audioMuted:false})

        break;
      case 'unmute':
        if (this.data.disableMute) {
          this.data.handStatus = false;
          this.XYClient.onMute();
        } else {
          this.setData({audioMuted:true})
        }
       
        break;
      case 'handUp':
        this.XYClient.onHandUp ();
        this.data.handStatus = true;
        break;
      case 'handDown':
        this.XYClient.onHandDown ();
        this.data.handStatus = false;
        break;
      default:
        break;
    }
    this.muteStatus ();
  },

  /**
   * 开启/关闭摄像头
   */
  onSwitchCamera () {
    this.setData ({camera: !this.data.camera});
    this.resetOperateBarTimmer();
  },

  /**
   * 退出会议界面
   */
  onStopMeeting () {
    // 挂断会议
    this.XYClient.hangup ();

    wx.navigateBack ({delta: 1});
  },

  /**
   * 显示/隐藏邀请信息
   */
  onChangeinviteSatus () {
    this.setData ({inviteInfoShow: !this.data.inviteInfoShow});
  },

  /**
   * 显示/隐藏参会者列表
   */
  onChangeRosterShowStatus () {
    this.setData ({rosterShow: !this.data.rosterShow});
  },

  /**
   * 挂断会议消息
   * 收到此消息可能是因为服务异常、会控挂断、网络断链等情况
   */
  disConnectMeeting (detail) {
    console.log ('disConnectMeeting detail:', detail);
    const {message} = detail;

    if (message) {
      // 存在message消息，则直接提示，默认3s后退会会议界面
      // 注意此处的message可以直接用做展示使用，不需要开发者再进行错误码的匹配
      this.XYClient.showToast (message, () => {
        this.onStopMeeting ();
      });
    } else {
      // 不存在message消息，直接退会
      this.onStopMeeting ();
    }
  },

  /**
   * SDK上报的事件消息
   *
   * @param { object } event - 事件消息内容
   */
  onRoomEvent (event) {
    const {type, detail} = event.detail;

    switch (type) {
      case 'connected':
        // 入会成功消息
        console.log ('demo get connected message: ', detail);
        this.data.localCallUri=detail.callUri
        // 开始计算会议时长
        this.onCreateMeetingTimeCount ();
        // 订阅参会者
        this.XYClient.subscribeBulkRoster()
        // 五秒后收起会议操作调
        this.resetOperateBarTimmer();
        break;
      case 'disconnected':
        // 退出会议消息
        console.log ('demo get disconnected message: ', detail);
        this.disConnectMeeting (detail);
        break;
      case 'meetingInfo':
        // 会议相关信息，包含会议ID、会议邀请信息等
        console.log ('demo get meetingInfo message', detail);
        this.setData ({meetingInfo: detail});
        break;
      case 'roomChange':
        // live-pusher推流状态消息
        console.log ('demo get live-pusher status change message: ', detail);

        break;
      case 'onHold':
        // 被会控移入等候室，当前参会者无法接收到远端的声音和画面，本地画面和声音也无法发送
        console.log ('demo get onHold message: ', detail);

        this.setData ({onHold: detail});
        //进入等候室
        if(detail){
          console.log(this.data.audioMuted,this.data.camera,'进入等候音视频状态');
          this.setData({holdCamera:!this.data.camera,holdAudioMuted:this.data.audioMuted})
        }else{
          console.log(this.data.holdAudioMuted,this.data.holdCamera,'进入会议音视频状态');

          this.setData({camera:!this.data.holdCamera,audioMuted:this.data.holdAudioMuted})
          this.muteStatus ();
        }
        
        break;
      case 'roster':
        // 参会者列表数据，当有人员变动或者状态变动，会实时推送最新的列表数据
        console.log ('demo get roster message: ', detail);
        
        this.setData ({total: detail.participantsNum});
        // 自动布局不需要处理Roster数据
        if (this.data.template.layout !== 'custom') {
          return;
        }

        this.handleCustomLayout (detail);
        break;
      case "bulkRoster":
        // 全量参会者列表数据
        console.log ('demo get bulkRoster message: ', detail);
        this.data.rosterList = detail;
        this.bindSearch ({detail: {value: this.data.searchVal}});

        break
      case 'netQualityLevel':
        // 网络质量等级
        console.log ('demo get netQualityLevel: ', detail);

        break;
      case 'audioStatus':
        // 推送实时麦克风状态，最新的麦克风状态请以此为准
        console.log ('demo get audio status: ', detail);

        this.setData({audioMuted:detail})
        break;
      case 'confMgmt':
        // 会控消息
        console.log ('demo get 会控消息：', detail);
        
        const {muteOperation, disableMute} = detail;
        this.showAudioStatus (muteOperation, disableMute);
        break;
      case 'eventClick':
        // 画面点击事件
        console.log ('demo get eventClick message：', detail);

        break;
      case 'eventLongPress':
        // 画面长按事件
        console.log ('demo get eventLongPress message：', detail);
        break;
      case 'eventDoubleClick':
        // 画面双击事件
        console.log ('demo get eventDoubleClick message：', detail);
        break;
      case 'speakersInfo':
        // 当前讲话人信息
        console.log ('demo get speakersInfo message：', detail);
        break;
      case 'networkParameter':
        // 网络质量等级
        console.log ('networkParameter msg:', detail);
        break;
      case 'networkLevel':
        // 监听本地端网络质量等级
        console.log ('networkLevel msg:', detail);
        this.setData ({localNetworkLevel: detail});
        break;
      case 'meetingStats':
        // 参会者网络质量数据
        console.log ('meetingStats msg:', detail);
        this.handleNetInfo (detail);
        break;
      case 'content':
        // 当前共享content的参会者信息
        console.log ('content msg:', detail);
        this.data.content = detail || {};
        break;
      default: {
        console.log ('demo get other message: ', event.detail);
      }
    }
  },

  /**
   * 自定义布局，处理模板计算
   *
   * @param { * } detail - roster事件数据
   */
  handleCustomLayout (detail) {
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

    roster.forEach ((item, index) => {
      newDetails.push ({
        position: CUSTOM_TEMPLATE[len].other[index].position,
        callNumber: item.callNumber,
        name: item.displayName || '',
        quality: item.isContent ? 'hd' : 'normal',
        isContent: item.isContent,
      });
    });

    // 自己的数据补充到第一位
    newDetails.unshift (selfDetailObj);

    this.setData ({
      template: Object.assign ({}, this.data.template, {
        detail: newDetails,
      }),
    });
  },

  /**
   * 计算AudioIcon
   *
   */
  muteStatus () {
    let status = this.data.audioMuted ? 'mute' : 'unmute';
    if (this.data.disableMute && this.data.audioMuted) {
      status = this.data.handStatus ? 'handDown' : 'handUp';
    }
    const audioMap = {
      mute: {
        text: '取消静音',
        img: audioMuteIcon,
      },
      unmute: {
        text: '静音',
        img: audioUnmuteIcon,
      },
      handUp: {
        text: '举手发言',
        img: handUpIcon,
      },
      handDown: {
        text: '取消举手',
        img: handDownIcon,
      },
    };
    this.setData ({audioData: {...audioMap[status], type: status}});
  },

  /**
   * 显示当前会控对此设备的声音操作
   *
   */
  showAudioStatus (muteOperation, disableMute) {
    if (this.data.onHold) {
      return;
    }

    this.data.disableMute = disableMute;
    if (muteOperation === 'mute') {
      if (disableMute) {
        this.data.handStatus = false;
        this.XYClient.showToast ('主持人已强制静音，如需发言，请点击“举手发言”');
      } else {
        this.XYClient.showToast ('您已被主持人静音');
      }
    } else if (muteOperation === 'unmute') {
      if (disableMute) {
        this.data.handStatus = false;
        this.XYClient.showToast ('主持人已允许您发言');
      } else {
        this.XYClient.showToast ('您已被主持人取消静音');
      }
    }
    this.muteStatus ();
  },

  /**
   * 格式化时间
   *
   */
  secondToDate (result) {
    const formatVal = (num)=>{
      return num.toString().length<2?"0"+num:num
    }
    var h =formatVal(Math.floor (result / 3600)) ;
    var m =  formatVal(Math.floor (result / 60 % 60));
    var s =  formatVal(Math.floor (result % 60));
    
    return (h + ':' + m + ':' + s);
  },

  /**
   * 计算会议时长
   *
   */
  onCreateMeetingTimeCount () {
    this.data.lastTapTime = 0;
    this.meetingTimer = setInterval (() => {
      this.data.lastTapTime += 1;
      this.setData ({meetingTime: this.secondToDate(this.data.lastTapTime)});
    }, 1000);
  },

  /**
   * 搜索参会者
   *
   */
  bindSearch (e) {
    this.data.searchTimer && clearTimeout (this.data.searchTimer);
    const value = e.detail.value;
    this.data.searchVal = value;
    this.data.searchTimer = setTimeout (() => {
      let data = [];
      if (value) {
        data = this.data.rosterList.filter (item => {
          return (
            item.displayName.toLowerCase ().search (value.toLowerCase ()) > -1
          );
        });
      } else {
        data = this.data.rosterList;
      }
      const filterRoster = data.map ((item) => {
        const {deviceType,callUri,isActiveSpeaker,videoTxMute,videoRxMute,audioRxMute,audioTxMute} = item
        return {
          ...item,
          avatar: this.getDeviceAvatar(deviceType),
          isContent:callUri === this.data.content.callUri,
          isLocal:callUri === this.data.localCallUri,
          isActiveSpeaker: isActiveSpeaker && !audioTxMute,
          isContentOnly: videoTxMute &&
            videoRxMute &&
            audioRxMute &&
            audioTxMute,
        };
      });

      this.setData ({filterRosterList: filterRoster});
      this.data.searchTimer && clearTimeout (this.data.searchTimer);
    }, 500);
  },

  /**
   * 获取默认头像
   *
   */
   getDeviceAvatar(type = "default", theme = "default") {
    const prefix =
      theme === "default" ? "../../static/images/history/" : "../../static/images/device/";
  
    type = DEVICE_TYPE_MAP[type] || DEVICE_TYPE_MAP["default"];
  
    return `${prefix}${type}.png`;
  },

  /**
   * 双击信号图标打开网络信息面板
   *
   */
  onShowNetInfo (e) {
    var thisTime = +e.timeStamp;
    if (+thisTime - this.data.timeStamp < 500) {
      this.setData ({netInfoShow: true});
    }
    this.data.timeStamp = +thisTime;
  },

  /**
   * 关闭网络信息面板
   *
   */
  onCloseNetInfo () {
    this.setData ({netInfoShow: false});
  },

  /**
   * 复制
   *
   */
  copyText (e) {
    const data = e.target.dataset.data;
    const tip = e.target.dataset.tip;
    const that = this;
    if (data) {
      wx.setClipboardData ({
        data,
        success () {
          that.XYClient.showToast (tip);
        },
      });
    }
  },

  /**
   * 处理网络质量数据
   *
   */
  handleNetInfo (detail) {
    if(detail){
    let receiveNetJitter = 0;
    let receiveBitrate = 0;

    const data = {
      detectionList:[],
      memberList:[]
    }

    Object.keys(detail).forEach (key => {
      const item = detail[key]||{};
      const {info, userId, displayName} = item;
      const {
        netJitter,
        audioBitrate,
        videoBitrate,
        videoFPS,
        videoWidth,
        videoHeight,
      } = info;

      data.memberList.push ({
        ...info,
        typeText: key === 'local'?'发送':"接收",
        id: userId,
        displayName,
        fps: videoFPS,
        resolution: videoWidth + '*' + videoHeight,
      });

      if (key === 'local') {
        data.detectionList.push({type: '发送', netJitter, bitrate:  audioBitrate + videoBitrate})
      
        return false;
      }
      // 取最大值
      receiveNetJitter = Math.max (receiveNetJitter, netJitter);
      receiveBitrate += audioBitrate + videoBitrate;
    });

    data.detectionList.push({type: '接收', netJitter: receiveNetJitter, bitrate: receiveBitrate},)
    this.setData ({netInfoDetail: data});
  }},

  // 五秒隐藏操作栏
  resetOperateBarTimmer(){
    clearTimeout(this.data.operateBarTimmer);
    if(this.data.showOperateBar){
      this.data.operateBarTimmer=setTimeout(()=>{
        this.setData({showOperateBar:false})
      },5000)
    }
  },

   // 点击视频content，隐藏operateBar
   onClickContent() {
    const nowTime = Math.round(new Date().getTime() / 1000); 
    if (nowTime - this.data.operateTimmer > 1) {
      this.setData({showOperateBar:!this.data.showOperateBar})
      this.data.operateTimmer = nowTime;
    }
    this.resetOperateBarTimmer();
  },
});
