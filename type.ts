/**
 * 单击/长按事件类型
 */
interface IClickEvent {
  changedTouches: [
    {
      clientX: number;
      clientY: 127.734375;
      force: 1;
      identifier: 0;
      pageX: 367.546875;
      pageY: 127.734375;
    }
  ];
  currentTarget: {
    dataset: {
      item: {
        deal: boolean;
        fit: string;
        id: string;
        muted: boolean;
        playUrl: string;
        position: number[];
        resolution: number;
        roster: {
          deviceType: string;
          callNumber: string;
          pid: number;
          userId: string;
          displayName: string;
          audioTxMute: true;
          isActiveSpeaker: boolean;
          isContent: boolean;
          isOnHold: boolean;
          muted: boolean;
          videoMuteReason: number;
          videoTxMute: boolean;
        };
        status: string;
        style: string;
      };
      id: string;
      offsetLeft: number;
      offsetTop: number;
    };
  };
  detail: {
    x: number;
    y: number;
  };
  type: string;
}

/**
 * 登录用户信息
 */
interface IUserInfo {
  appId: string;
  callNumber: string;
  deviceSN: string;
  displayName: string;
  securityKey: string;
  token: string;
  userId: string;
}

/**
 * 当前讲话人信息
 */
interface IActiveSpeaker {
  isActiveSpeaker: boolean;
  pid: number;
  userId: string;
}

/**
 * Client配置参数
 *
 * @property { string } server - 设置服务器地址
 * @property { 'auto' | 'custom' } layoutMode - 设置布局模式，可选：auto ｜ custom
 * @property { boolean } report - 是否启用数据实时上报
 * @property { * } container - 设置容器信息，默认使用可视屏幕的宽高计算画面的坐标的大小，单位PX
 * @property { number[] } container.offset - 设置容器偏移量，分别代表：left, top, width, height
 */
interface IClientConfig {
  server: string;
  layoutMode: 'auto' | 'custom';
  report: boolean;
  container: {
    offset: [number, number, number, number];
  };
}
