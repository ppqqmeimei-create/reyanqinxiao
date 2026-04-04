/**
 * 任务界面 - 错误处理和数据验证模块
 * 文件: front-end/pages/Task/utils/taskValidator.js
 * 功能: 提供任务数据验证和错误处理
 */

/**
 * 任务数据验证规则
 */
export const taskValidationRules = {
  // 生态巡查任务验证规则
  ecology: {
    title: {
      required: true,
      minLength: 5,
      maxLength: 200,
      pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\-_]+$/
    },
    type: {
      required: true,
      enum: ['quick-sampling', 'complete-sampling', 'inspection', 'monitoring']
    },
    location: {
      required: true,
      minLength: 5,
      maxLength: 255
    },
    priority: {
      required: true,
      enum: ['low', 'medium', 'high', 'urgent']
    },
    estimatedHours: {
      required: false,
      min: 0,
      max: 1000
    }
  },
  
  // 食品药品任务验证规则
  fooddrug: {
    title: {
      required: true,
      minLength: 5,
      maxLength: 200,
      pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\-_]+$/
    },
    type: {
      required: true,
      enum: ['product-inspection', 'recall-management', 'compliance-check', 'enterprise-audit']
    },
    enterpriseId: {
      required: true,
      pattern: /^\d+$/
    },
    priority: {
      required: true,
      enum: ['low', 'medium', 'high', 'urgent']
    },
    estimatedHours: {
      required: false,
      min: 0,
      max: 1000
    }
  },
  
  // 执法任务验证规则
  enforcement: {
    title: {
      required: true,
      minLength: 5,
      maxLength: 200,
      pattern: /^[\u4e00-\u9fa5a-zA-Z0-9\-_]+$/
    },
    type: {
      required: true,
      enum: ['case-investigation', 'evidence-collection', 'penalty-execution', 'follow-up-inspection']
    },
    location: {
      required: true,
      minLength: 5,
      maxLength: 255
    },
    priority: {
      required: true,
      enum: ['low', 'medium', 'high', 'urgent']
    },
    estimatedHours: {
      required: false,
      min: 0,
      max: 1000
    }
  }
}

/**
 * 验证单个字段
 */
export function validateField(fieldName, fieldValue, rules) {
  if (!rules) return { valid: true }
  
  const rule = rules[fieldName]
  if (!rule) return { valid: true }
  
  // 检查必填字段
  if (rule.required && !fieldValue) {
    return {
      valid: false,
      error: `${fieldName}为必填项`
    }
  }
  
  // 检查最小长度
  if (rule.minLength && fieldValue && fieldValue.length < rule.minLength) {
    return {
      valid: false,
      error: `${fieldName}长度不能少于${rule.minLength}个字符`
    }
  }
  
  // 检查最大长度
  if (rule.maxLength && fieldValue && fieldValue.length > rule.maxLength) {
    return {
      valid: false,
      error: `${fieldName}长度不能超过${rule.maxLength}个字符`
    }
  }
  
  // 检查正则表达式
  if (rule.pattern && fieldValue && !rule.pattern.test(fieldValue)) {
    return {
      valid: false,
      error: `${fieldName}格式不正确`
    }
  }
  
  // 检查枚举值
  if (rule.enum && fieldValue && !rule.enum.includes(fieldValue)) {
    return {
      valid: false,
      error: `${fieldName}值不在允许范围内`
    }
  }
  
  // 检查最小值
  if (rule.min !== undefined && fieldValue !== null && fieldValue < rule.min) {
    return {
      valid: false,
      error: `${fieldName}不能小于${rule.min}`
    }
  }
  
  // 检查最大值
  if (rule.max !== undefined && fieldValue !== null && fieldValue > rule.max) {
    return {
      valid: false,
      error: `${fieldName}不能大于${rule.max}`
    }
  }
  
  return { valid: true }
}

/**
 * 验证整个任务对象
 */
export function validateTask(task, category) {
  const rules = taskValidationRules[category]
  if (!rules) {
    return {
      valid: false,
      errors: [`未知的任务分类: ${category}`]
    }
  }
  
  const errors = []
  
  for (const [fieldName, fieldValue] of Object.entries(task)) {
    const result = validateField(fieldName, fieldValue, rules)
    if (!result.valid) {
      errors.push(result.error)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

/**
 * 错误处理工具
 */
export const errorHandler = {
  /**
   * 处理API错误
   */
  handleApiError(error, defaultMessage = '操作失败') {
    if (error.response) {
      // 服务器返回错误响应
      const { status, data } = error.response
      
      switch (status) {
        case 400:
          return data.message || '请求参数错误'
        case 401:
          return '未授权，请重新登录'
        case 403:
          return '禁止访问'
        case 404:
          return '资源不存在'
        case 500:
          return '服务器错误'
        default:
          return data.message || defaultMessage
      }
    } else if (error.request) {
      // 请求已发送但没有收到响应
      return '网络连接失败'
    } else {
      // 其他错误
      return error.message || defaultMessage
    }
  },
  
  /**
   * 处理验证错误
   */
  handleValidationError(errors) {
    if (Array.isArray(errors)) {
      return errors.join('\n')
    }
    return errors
  },
  
  /**
   * 显示错误提示
   */
  showError(message) {
    uni.showToast({
      title: message,
      icon: 'none',
      duration: 2000
    })
  },
  
  /**
   * 显示成功提示
   */
  showSuccess(message = '操作成功') {
    uni.showToast({
      title: message,
      icon: 'success',
      duration: 2000
    })
  }
}

/**
 * 数据转换工具
 */
export const dataTransformer = {
  /**
   * 转换任务数据为API格式
   */
  toApiFormat(task) {
    return {
      title: task.title,
      type: task.type,
      category: task.category,
      status: task.status || 'pending',
      priority: task.priority || 'medium',
      location: task.location,
      latitude: task.latitude,
      longitude: task.longitude,
      assigned_to: task.assigned_to,
      estimated_hours: task.estimated_hours,
      description: task.description
    }
  },
  
  /**
   * 转换API数据为前端格式
   */
  fromApiFormat(apiTask) {
    return {
      id: apiTask.id,
      title: apiTask.title,
      type: apiTask.type,
      category: apiTask.category,
      status: apiTask.status,
      priority: apiTask.priority,
      location: apiTask.location,
      latitude: apiTask.latitude,
      longitude: apiTask.longitude,
      assigned_to: apiTask.assigned_to,
      estimated_hours: apiTask.estimated_hours,
      actual_hours: apiTask.actual_hours,
      progress: apiTask.progress,
      description: apiTask.description,
      created_at: apiTask.created_at,
      updated_at: apiTask.updated_at
    }
  }
}
