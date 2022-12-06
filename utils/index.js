/**
 * 工具函数库
 */

/**
 * 显示Toast提示
 *
 * @param { object | string } param - 配置Toast参数，如果是string，则代表Toast内容值
 * @param { string } param.title - Toast内容
 * @param { number } param.duration - Toast持续显示时间
 * @param { boolean } param.mask - Toast是否显示遮罩
 * @param { string } param.icon - Toast图标，默认没有
 * @param { function } hideCallback - 隐藏Toast时的回调函数
 */
export const showToast = (params, hideCallback = () => {}) => {
  const defaultParams = { title: '', duration: 3000, mask: true, icon: 'none' };
  // params是对象，则合并默认参数
  const mergeParams = typeof params === 'object' ? Object.assign({}, defaultParams, params) : defaultParams;
  // params是字符串，则直接获取toast内容
  const title = typeof params === 'string' ? params : params.title;
  const { icon, mask, duration } = mergeParams;

  wx.showToast({
    title,
    icon,
    mask,
    duration: 2000,
    success: () => {
      setTimeout(() => {
        hideCallback();
      }, duration);
    },
  });
};
