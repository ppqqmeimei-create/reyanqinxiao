import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useUserStore } from './user.js';

const BASE_URL = (() => {
	const configured = uni.getStorageSync('baseURL')
	if (configured) return configured.replace(/\/$/, '')
	return 'http://127.0.0.1:3000'
})()

const SAFE_CLOSE_CODE = 1000

function normalizeCloseCode(code) {
  if (code === 1000) return 1000
  if (typeof code === 'number' && code >= 3000 && code <= 4999) return code
  return SAFE_CLOSE_CODE
}

export const useRealtimeStore = defineStore('realtime', () => {
  const wsTask = ref(null);
  const connected = ref(false);
  const unreadWarnings = ref(0);
  const deviceOfflineCount = ref(0);
  const latestWarnings = ref([]);
  const connecting = ref(false)
  const globalListenersBound = ref(false)
  const manualClosing = ref(false)

  const badgeText = computed(() => {
    const total = unreadWarnings.value + deviceOfflineCount.value;
    if (total <= 0) return '';
    return total > 99 ? '99+' : String(total);
  });

  function pushWarning(payload) {
    const warning = (payload && payload.alert) || payload || {};
    latestWarnings.value.unshift(warning);
    latestWarnings.value = latestWarnings.value.slice(0, 20);
    unreadWarnings.value += 1;

    uni.showToast({
      title: (warning && warning.title) || '收到新预警',
      icon: 'none',
      duration: 2000
    });
  }

  function onSocketMessage(message) {
    try {
      const packet = JSON.parse(message.data || '{}');
      if (packet.event === 'warning:new') {
        pushWarning(packet.data);
        uni.vibrateShort();
      }
      if (packet.event === 'device:heartbeat' && packet.data && packet.data.device && packet.data.device.status === 'offline') {
        deviceOfflineCount.value += 1;
        uni.showToast({ title: '设备离线告警', icon: 'none' });
      }
    } catch (_) {}
  }

  function attachSocketTask(task) {
    if (!task || typeof task.onOpen !== 'function') return false;

    task.onOpen(() => {
      connecting.value = false
      connected.value = true;
      manualClosing.value = false
      wsTask.value = task;
    });
    task.onClose(() => {
      connecting.value = false
      connected.value = false;
      wsTask.value = null;
      manualClosing.value = false
    });
    task.onError(() => {
      connecting.value = false
      connected.value = false;
    });
    task.onMessage(onSocketMessage);
    wsTask.value = task;
    return true;
  }

  /** 微信小程序等：connectSocket 返回 Promise 或非 SocketTask 时，使用全局监听 */
  function attachGlobalListeners() {
    if (globalListenersBound.value) return
    globalListenersBound.value = true

    uni.onSocketOpen(() => {
      connecting.value = false
      connected.value = true;
      manualClosing.value = false
    });
    uni.onSocketClose(() => {
      connecting.value = false
      connected.value = false;
      wsTask.value = null;
      manualClosing.value = false
    });
    uni.onSocketError(() => {
      connecting.value = false
      connected.value = false;
    });
    uni.onSocketMessage(onSocketMessage);
    wsTask.value = {
      close: (code = SAFE_CLOSE_CODE) => {
        try {
          uni.closeSocket({ code: normalizeCloseCode(code) });
        } catch (_) {}
      }
    };
  }

  function connectWs() {
    const userStore = useUserStore();
    if (!userStore.token) return;
    if (connected.value || connecting.value || manualClosing.value) return;
    if (wsTask.value && typeof wsTask.value.close === 'function') return;

    const wsProto = BASE_URL.startsWith('https') ? 'wss' : 'ws'
    const wsBase = BASE_URL.replace(/^http/, wsProto)
    const url = `${wsBase}/api/v1/ws/command?token=${encodeURIComponent(userStore.token)}`;

    connecting.value = true
    try {
      const ret = uni.connectSocket({ url });

      if (ret && typeof ret.then === 'function') {
        ret
          .then((task) => {
            if (!attachSocketTask(task)) {
              attachGlobalListeners();
            }
          })
          .catch(() => {
            connecting.value = false
            connected.value = false;
          });
        return;
      }

      if (!attachSocketTask(ret)) {
        attachGlobalListeners();
      }
    } catch (_) {
      connecting.value = false
      connected.value = false;
    }
  }

  function disconnectWs() {
    const closeCode = normalizeCloseCode(SAFE_CLOSE_CODE)
    manualClosing.value = true
    connecting.value = false

    if (wsTask.value && typeof wsTask.value.close === 'function') {
      try {
        wsTask.value.close(closeCode);
      } catch (_) {}
    }
    try {
      uni.closeSocket({ code: closeCode });
    } catch (_) {}
    wsTask.value = null;
    connected.value = false;
  }

  function clearUnread() {
    unreadWarnings.value = 0;
  }

  watch(badgeText, (val) => {
    try {
      if (val) uni.setTabBarBadge({ index: 1, text: val });
      else uni.removeTabBarBadge({ index: 1 });
    } catch (_) {}
  });

  return {
    connected,
    unreadWarnings,
    deviceOfflineCount,
    latestWarnings,
    badgeText,
    connectWs,
    disconnectWs,
    clearUnread,
    pushWarning
  };
});
