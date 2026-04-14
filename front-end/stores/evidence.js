/**
 * ==========================================
 * Evidence Store - 证据链合规管理
 * ==========================================
 * 数字签名、区块链存证、操作审计
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { BUSINESS_CONSTANTS } from '../utils/systemConfig.js';

export const useEvidenceStore = defineStore('evidence', () => {
  // ===== 证据库 =====
  const evidenceList = ref([]);

  // ===== 证据队列状态 =====
  const uploadQueue = ref([]);  // 待上传队列
  const uploadedRecords = ref([]);  // 已上传记录
  const failedRecords = ref([]);  // 失败记录

  // ===== 数字签名 =====
  const digitalSignatures = ref({});  // evidenceId -> { signature, timestamp, publicKey }

  // ===== 区块链存证记录 =====
  const blockchainRecords = ref([]);  // 已上链记录

  // ===== 操作审计日志 =====
  const auditLogs = ref([]);

  // ===== 证据链完整性状态 =====
  const integrityCheckResults = ref({});  // evidenceId -> { status, hash, verified }

  // ===== 计算属性 =====
  const pendingEvidence = computed(() =>
    evidenceList.value.filter(e => e.status === 'pending')
  );

  const criticalEvidence = computed(() =>
    evidenceList.value.filter(e =>
      e.securityLevel === BUSINESS_CONSTANTS.EVIDENCE_LEVELS.CRITICAL.level
    )
  );

  const blockchainRate = computed(() => {
    if (evidenceList.value.length === 0) return 0;
    return Math.round(
      (blockchainRecords.value.length / evidenceList.value.length) * 100
    );
  });

  // ===== 核心Actions =====
  function addEvidence(evidence) {
    const id = evidence.id || `EV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const record = {
      id,
      createdAt: new Date().toISOString(),
      uploadedAt: null,
      status: 'pending',  // pending | uploading | onchain | failed
      securityLevel: evidence.securityLevel || BUSINESS_CONSTANTS.EVIDENCE_LEVELS.IMPORTANT.level,
      digitalSignature: null,
      blockchainTxId: null,
      integrityHash: _generateIntegrityHash(evidence),
      operator: uni.getStorageSync('user_info')?.name || 'unknown',
      ...evidence,
    };
    evidenceList.value.unshift(record);
    _addAuditLog('CREATE', id, '新增证据记录');
    return id;
  }

  // ===== 数字签名 =====
  function signEvidence(evidenceId, signature, publicKey) {
    digitalSignatures.value[evidenceId] = {
      signature,
      publicKey,
      timestamp: new Date().toISOString(),
      algorithm: 'RSA-SHA256',
    };

    const idx = evidenceList.value.findIndex(e => e.id === evidenceId);
    if (idx !== -1) {
      evidenceList.value[idx].digitalSignature = {
        signature,
        publicKey,
        timestamp: new Date().toISOString(),
        algorithm: 'RSA-SHA256',
      };
    }
    _addAuditLog('SIGN', evidenceId, '证据数字签名完成');
  }

  // ===== 区块链存证 =====
  async function submitToBlockchain(evidenceId) {
    const idx = evidenceList.value.findIndex(e => e.id === evidenceId);
    if (idx === -1) return false;

    try {
      evidenceList.value[idx].status = 'uploading';

      // 模拟区块链上链
      const txId = await _mockBlockchainSubmit(evidenceId);

      evidenceList.value[idx].status = 'onchain';
      evidenceList.value[idx].blockchainTxId = txId;
      evidenceList.value[idx].uploadedAt = new Date().toISOString();

      blockchainRecords.value.push({
        txId,
        evidenceId,
        timestamp: new Date().toISOString(),
        blockHeight: Math.floor(Math.random() * 1000000) + 8000000,
        merkleRoot: _generateMerkleRoot(txId, evidenceId),
      });

      _addAuditLog('ONCHAIN', evidenceId, `上链成功，TxID: ${txId}`);
      return true;
    } catch (error) {
      evidenceList.value[idx].status = 'failed';
      _addAuditLog('ONCHAIN_FAILED', evidenceId, `上链失败: ${error.message}`);
      return false;
    }
  }

  // ===== 完整性校验 =====
  function verifyIntegrity(evidenceId) {
    const record = evidenceList.value.find(e => e.id === evidenceId);
    if (!record) return false;

    // 模拟哈希校验
    const currentHash = _generateIntegrityHash(record);
    const isValid = currentHash === record.integrityHash;

    integrityCheckResults.value[evidenceId] = {
      status: isValid ? 'VALID' : 'TAMPERED',
      expectedHash: record.integrityHash,
      actualHash: currentHash,
      verifiedAt: new Date().toISOString(),
    };

    _addAuditLog('VERIFY', evidenceId, `完整性校验: ${isValid ? '通过' : '失败'}`);
    return isValid;
  }

  // ===== 批量上链 =====
  async function batchSubmitToBlockchain(evidenceIds) {
    const results = await Promise.allSettled(
      evidenceIds.map(id => submitToBlockchain(id))
    );
    return results;
  }

  // ===== 审计日志 =====
  function _addAuditLog(action, targetId, description, metadata = {}) {
    auditLogs.value.unshift({
      id: `AUD-${Date.now()}`,
      action,
      targetId,
      description,
      operator: uni.getStorageSync('user_info')?.name || 'system',
      operatorRole: uni.getStorageSync('user_info')?.role || 'unknown',
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1',  // uni-app中实际应从后端获取
      deviceId: uni.getSystemInfoSync().deviceId || 'unknown',
      classification: _getClassification(action),
      metadata,
    });

    // 持久化审计日志
    uni.setStorageSync('evidence_audit_logs', auditLogs.value.slice(0, 1000));
  }

  function getAuditLogs(filters = {}) {
    let logs = [...auditLogs.value];
    if (filters.action) logs = logs.filter(l => l.action === filters.action);
    if (filters.targetId) logs = logs.filter(l => l.targetId === filters.targetId);
    if (filters.operator) logs = logs.filter(l => l.operator.includes(filters.operator));
    if (filters.dateRange) {
      const [start, end] = filters.dateRange;
      logs = logs.filter(l => {
        const t = new Date(l.timestamp).getTime();
        return t >= start && t <= end;
      });
    }
    return logs;
  }

  // ===== 数据分级 =====
  function setEvidenceClassification(evidenceId, classificationLevel) {
    const idx = evidenceList.value.findIndex(e => e.id === evidenceId);
    if (idx !== -1) {
      evidenceList.value[idx].classification = classificationLevel;
      _addAuditLog('CLASSIFY', evidenceId, `数据分级设置为: ${classificationLevel}`);
    }
  }

  // ===== 导出合规报告 =====
  function generateComplianceReport(evidenceId) {
    const record = evidenceList.value.find(e => e.id === evidenceId);
    if (!record) return null;

    const logs = getAuditLogs({ targetId: evidenceId });
    const signature = digitalSignatures.value[evidenceId];
    const blockchain = blockchainRecords.value.find(r => r.evidenceId === evidenceId);
    const integrity = integrityCheckResults.value[evidenceId];

    return {
      evidenceId,
      reportId: `RPT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      evidence: record,
      digitalSignature,
      blockchainRecord: blockchain,
      integrityCheck: integrity,
      auditTrail: logs,
      summary: {
        isSigned: !!signature,
        isOnChain: !!blockchain,
        isVerified: integrity?.status === 'VALID',
        chainOfCustody: logs.length,
      },
    };
  }

  // ===== 工具方法 =====
  function _generateIntegrityHash(data) {
    const str = JSON.stringify({
      file: data.fileName || data.file,
      location: data.location,
      timestamp: data.createdAt,
      operator: data.operator,
    });
    return `HASH-${Date.now()}-${btoa(encodeURIComponent(str)).substr(0, 32).toUpperCase()}`;
  }

  async function _mockBlockchainSubmit(evidenceId) {
    // 模拟区块链上链延迟
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
    return `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')}`;
  }

  function _generateMerkleRoot(txId, evidenceId) {
    return `MR-${txId.substr(0, 8)}-${evidenceId.substr(0, 8)}-${Date.now()}`;
  }

  function _getClassification(action) {
    const map = {
      CREATE: BUSINESS_CONSTANTS.DATA_CLASSIFICATION.CONFIDENTIAL.level,
      SIGN: BUSINESS_CONSTANTS.DATA_CLASSIFICATION.SECRET.level,
      ONCHAIN: BUSINESS_CONSTANTS.DATA_CLASSIFICATION.SECRET.level,
      VERIFY: BUSINESS_CONSTANTS.DATA_CLASSIFICATION.INTERNAL.level,
      CLASSIFY: BUSINESS_CONSTANTS.DATA_CLASSIFICATION.CONFIDENTIAL.level,
    };
    return map[action] || BUSINESS_CONSTANTS.DATA_CLASSIFICATION.INTERNAL.level;
  }

  // ===== 初始化 =====
  function init() {
    const savedLogs = uni.getStorageSync('evidence_audit_logs');
    if (Array.isArray(savedLogs)) {
      auditLogs.value = savedLogs;
    }
  }

  return {
    // 状态
    evidenceList,
    uploadQueue,
    uploadedRecords,
    failedRecords,
    digitalSignatures,
    blockchainRecords,
    auditLogs,
    integrityCheckResults,

    // 计算属性
    pendingEvidence,
    criticalEvidence,
    blockchainRate,

    // Actions
    addEvidence,
    signEvidence,
    submitToBlockchain,
    verifyIntegrity,
    batchSubmitToBlockchain,
    getAuditLogs,
    setEvidenceClassification,
    generateComplianceReport,
    init,
  };
});
