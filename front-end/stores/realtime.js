import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';
import { useUserStore } from './user.js';

export const useRealtimeStore = defineStore('realtime', () => {
  const wsTask = ref(null);
  const connected = ref(false);
  const unreadWarnings = ref(0);
  const deviceOfflineCount = ref(0);
  const latestWarnings = ref([]);

  const badgeText = computed(() => {
    const total = unreadWarnings.value + deviceOfflineCount.value;
    if (total <= 0) return '';
    return total > 99 ? '99+' : String(total);
  });

  function pushWarning(payload) {
    const warning = payload?.alert || payload || {};
    latestWarnings.value.unshift(warning);
    latestWarnings.value = latestWarnings.value.slice(0, 20);
    unreadWarnings.value += 1;

    uni.showToast({
      title: warning?.title || '收到新预警',
      icon: 'none',
      duration: 2000
    });
  }

  function connectWs() {
    const userStore = useUserStore();
    if (!userStore.token) return;
    if (wsTask.value) return;

    wsTask.value = uni.connectSocket({
      url: `ws://localhost:5000/api/v1/ws/command?token=${encodeURIComponent(userStore.token)}`
    });

    wsTask.value.onOpen(() => {
      connected.value = true;
    });

    wsTask.value.onClose(() => {
      connected.value = false;
      wsTask.value = null;
    });

    wsTask.value.onError(() => {
      connected.value = false;
    });

    wsTask.value.onMessage((message) => {
      try {
        const packet = JSON.parse(message.data || '{}');
        if (packet.event === 'warning:new') {
          pushWarning(packet.data);
          uni.vibrateShort();
        }
        if (packet.event === 'device:heartbeat' && packet.data?.device?.status === 'offline') {
          deviceOfflineCount.value += 1;
          uni.showToast({ title: '设备离线告警', icon: 'none' });
        }
      } catch (_) {}
    });
  }

  function disconnectWs() {
    wsTask.value?.close?.();
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
