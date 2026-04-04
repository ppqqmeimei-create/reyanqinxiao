import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUserStore = defineStore('user', () => {
  const token = ref(uni.getStorageSync('token') || uni.getStorageSync('user_token') || '');
  const profile = ref(uni.getStorageSync('user_info') || null);

  function setAuth(payload) {
    token.value = payload?.token || '';
    profile.value = payload?.user || null;

    if (token.value) {
      uni.setStorageSync('token', token.value);
      uni.setStorageSync('user_token', token.value);
    }

    if (profile.value) {
      uni.setStorageSync('user_info', profile.value);
    }
  }

  function clearAuth() {
    token.value = '';
    profile.value = null;
    uni.removeStorageSync('token');
    uni.removeStorageSync('user_token');
    uni.removeStorageSync('user_info');
  }

  return {
    token,
    profile,
    setAuth,
    clearAuth
  };
});
