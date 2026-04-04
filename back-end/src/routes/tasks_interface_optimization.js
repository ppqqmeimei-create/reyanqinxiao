/**
 * 任务API - 优化版本
 * 文件: back-end/src/routes/tasks_interface_optimization.js
 * 功能: 提供任务管理、证据管理、采样管理等API
 */

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * GET /api/tasks/:id
 * 获取任务详情
 */
router.get('/:id', authenticate, async (req, res) => {
  try {
    const taskId = req.params.id;
    logger.info(`User ${req.user.id} requested task ${taskId}`);

    // 这里需要导入Task模型
    // const task = await Task.findById(taskId)
    //   .populate('inspector_id', 'name badge_number')
    //   .populate('created_by', 'name');

    // 模拟数据
    const task = {
      id: taskId,
      caseNumber: `CASE-20260315-000001`,
      title: '走私/生态案件检查',
      location: '某工业园区',
      locationAddress: '浙江省杭州市某工业园区',
      latitude: 30.2741,
      longitude: 120.1551,
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      inspectorId: 1,
      inspectorName: '执法员张三',
      status: 'processing',
      progress: 45,
      category: 'ecology',
      legalBasis: '《野生动物保护法》',
      legalArticles: ['第十条', '第二十条'],
      penaltySuggestion: '根据违规程度处以5000-50000元罚款'
    };

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    logger.error(`Error fetching task: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取任务详情失败',
      error: error.message
    });
  }
});

/**
 * POST /api/tasks/:id/evidence
 * 上传证据
 */
router.post('/:id/evidence', authenticate, async (req, res) => {
  try {
    const { taskId } = req.params;
    const { evidenceType, fileName, fileSize, fileHash, description, tags } = req.body;

    if (!evidenceType || !fileName) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    logger.info(`User ${req.user.id} uploading evidence for task ${taskId}`);

    // 这里需要导入Evidence模型
    // const evidence = await Evidence.create({
    //   task_id: taskId,
    //   evidence_type: evidenceType,
    //   file_name: fileName,
    //   file_size: fileSize,
    //   file_hash: fileHash,
    //   collected_by: req.user.id,
    //   description,
    //   tags
    // });

    // 模拟数据
    const evidence = {
      id: Math.floor(Math.random() * 10000),
      evidenceNumber: `CASE-20260315-000001-EV-0001`,
      evidenceType,
      fileName,
      fileSize,
      fileHash,
      collectedBy: req.user.id,
      collectedAt: new Date(),
      description,
      tags,
      isVerified: false
    };

    res.json({
      success: true,
      data: { evidence }
    });
  } catch (error) {
    logger.error(`Error uploading evidence: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '上传证据失败',
      error: error.message
    });
  }
});

/**
 * GET /api/tasks/:id/evidence
 * 获取证据列表
 */
router.get('/:id/evidence', authenticate, async (req, res) => {
  try {
    const taskId = req.params.id;
    logger.info(`User ${req.user.id} requested evidence for task ${taskId}`);

    // 这里需要导入Evidence模型
    // const evidences = await Evidence.find({ task_id: taskId })
    //   .sort({ collected_at: -1 });

    // 模拟数据
    const evidences = [];

    res.json({
      success: true,
      data: { evidences }
    });
  } catch (error) {
    logger.error(`Error fetching evidence: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取证据列表失败',
      error: error.message
    });
  }
});

/**
 * POST /api/tasks/:id/checklist
 * 更新检查清单
 */
router.post('/:id/checklist', authenticate, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { itemId, isChecked, notes } = req.body;

    if (itemId === undefined || isChecked === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    logger.info(`User ${req.user.id} updating checklist for task ${taskId}`);

    // 这里需要导入Checklist模型
    // const checklist = await Checklist.findByIdAndUpdate(
    //   itemId,
    //   {
    //     is_checked: isChecked,
    //     checked_by: req.user.id,
    //     checked_at: new Date(),
    //     notes
    //   },
    //   { new: true }
    // );

    // 模拟数据
    const checklist = {
      id: itemId,
      taskId,
      isChecked,
      checkedBy: req.user.id,
      checkedAt: new Date(),
      notes
    };

    res.json({
      success: true,
      data: { checklist }
    });
  } catch (error) {
    logger.error(`Error updating checklist: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '更新检查清单失败',
      error: error.message
    });
  }
});

/**
 * GET /api/tasks/:id/checklist
 * 获取检查清单
 */
router.get('/:id/checklist', authenticate, async (req, res) => {
  try {
    const taskId = req.params.id;
    logger.info(`User ${req.user.id} requested checklist for task ${taskId}`);

    // 这里需要导入Checklist模型
    // const checklists = await Checklist.find({ task_id: taskId });

    // 模拟数据
    const checklists = [];

    res.json({
      success: true,
      data: { checklists }
    });
  } catch (error) {
    logger.error(`Error fetching checklist: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取检查清单失败',
      error: error.message
    });
  }
});

/**
 * POST /api/tasks/:id/sampling
 * 添加采样记录
 */
router.post('/:id/sampling', authenticate, async (req, res) => {
  try {
    const taskId = req.params.id;
    const { sampleType, sampleLocation, measuredValue, standardValue, samplePhoto } = req.body;

    if (!sampleType || !sampleLocation) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    logger.info(`User ${req.user.id} adding sampling record for task ${taskId}`);

    // 计算超标倍数
    let exceedRatio = 0;
    let isExceed = false;
    if (standardValue > 0) {
      exceedRatio = (measuredValue / standardValue).toFixed(2);
      isExceed = measuredValue > standardValue;
    }

    // 这里需要导入SamplingRecord模型
    // const sampling = await SamplingRecord.create({
    //   task_id: taskId,
    //   sample_type: sampleType,
    //   sample_location: sampleLocation,
    //   sampled_by: req.user.id,
    //   measured_value: measuredValue,
    //   standard_value: standardValue,
    //   exceed_ratio: exceedRatio,
    //   is_exceed: isExceed,
    //   sample_photo: samplePhoto
    // });

    // 模拟数据
    const sampling = {
      id: Math.floor(Math.random() * 10000),
      sampleNumber: `CASE-20260315-000001-SP-0001`,
      sampleType,
      sampleLocation,
      sampledBy: req.user.id,
      sampledAt: new Date(),
      measuredValue,
      standardValue,
      exceedRatio,
      isExceed,
      samplePhoto
    };

    res.json({
      success: true,
      data: { sampling }
    });
  } catch (error) {
    logger.error(`Error adding sampling record: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '添加采样记录失败',
      error: error.message
    });
  }
});

/**
 * GET /api/tasks/:id/sampling
 * 获取采样记录
 */
router.get('/:id/sampling', authenticate, async (req, res) => {
  try {
    const taskId = req.params.id;
    logger.info(`User ${req.user.id} requested sampling records for task ${taskId}`);

    // 这里需要导入SamplingRecord模型
    // const samplings = await SamplingRecord.find({ task_id: taskId })
    //   .sort({ sampled_at: -1 });

    // 模拟数据
    const samplings = [];

    res.json({
      success: true,
      data: { samplings }
    });
  } catch (error) {
    logger.error(`Error fetching sampling records: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '获取采样记录失败',
      error: error.message
    });
  }
});

/**
 * POST /api/tasks/:id/enforcement-record
 * 保存执法记录
 */
router.post('/:id/enforcement-record', authenticate, async (req, res) => {
  try {
    const taskId = req.params.id;
    const {
      violatorName,
      violatorAddress,
      violationType,
      violationDescription,
      handlingOpinion,
      rectificationPeriod,
      legalBasis,
      penaltyAmount,
      penaltyType
    } = req.body;

    if (!violatorName || !violationType) {
      return res.status(400).json({
        success: false,
        message: '缺少必要字段'
      });
    }

    logger.info(`User ${req.user.id} saving enforcement record for task ${taskId}`);

    // 这里需要导入EnforcementRecord模型
    // const record = await EnforcementRecord.create({
    //   task_id: taskId,
    //   inspector_id: req.user.id,
    //   violator_name: violatorName,
    //   violator_address: violatorAddress,
    //   violation_type: violationType,
    //   violation_description: violationDescription,
    //   handling_opinion: handlingOpinion,
    //   rectification_period: rectificationPeriod,
    //   legal_basis: legalBasis,
    //   penalty_amount: penaltyAmount,
    //   penalty_type: penaltyType
    // });

    // 模拟数据
    const record = {
      id: Math.floor(Math.random() * 10000),
      taskId,
      inspectorId: req.user.id,
      violatorName,
      violatorAddress,
      violationType,
      violationDescription,
      handlingOpinion,
      rectificationPeriod,
      legalBasis,
      penaltyAmount,
      penaltyType,
      recordedAt: new Date()
    };

    res.json({
      success: true,
      data: { record }
    });
  } catch (error) {
    logger.error(`Error saving enforcement record: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '保存执法记录失败',
      error: error.message
    });
  }
});

/**
 * POST /api/tasks/:id/complete
 * 完成任务
 */
router.post('/:id/complete', authenticate, async (req, res) => {
  try {
    const taskId = req.params.id;
    logger.info(`User ${req.user.id} completing task ${taskId}`);

    // 这里需要导入Task模型
    // const task = await Task.findByIdAndUpdate(
    //   taskId,
    //   {
    //     status: 'completed',
    //     progress: 100,
    //     completed_by: req.user.id,
    //     completed_at: new Date()
    //   },
    //   { new: true }
    // );

    // 模拟数据
    const task = {
      id: taskId,
      status: 'completed',
      progress: 100,
      completedBy: req.user.id,
      completedAt: new Date()
    };

    res.json({
      success: true,
      data: { task }
    });
  } catch (error) {
    logger.error(`Error completing task: ${error.message}`);
    res.status(500).json({
      success: false,
      message: '完成任务失败',
      error: error.message
    });
  }
});

export default router;
