import Joi from 'joi';

/**
 * 登录验证
 */
export const validateLogin = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string().required().messages({
      'string.empty': '用户名不能为空',
      'any.required': '用户名是必需的'
    }),
    password: Joi.string().required().messages({
      'string.empty': '密码不能为空',
      'any.required': '密码是必需的'
    })
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  req.body = value;
  next();
};

/**
 * 注册验证
 */
export const validateRegister = (req, res, next) => {
  const schema = Joi.object({
    username: Joi.string()
      .alphanum()
      .min(3)
      .max(30)
      .required()
      .messages({
        'string.alphanum': '用户名只能包含字母和数字',
        'string.min': '用户名至少3个字符',
        'string.max': '用户名最多30个字符',
        'any.required': '用户名是必需的'
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': '请输入有效的邮箱',
        'any.required': '邮箱是必需的'
      }),
    password: Joi.string()
      .min(6)
      .required()
      .messages({
        'string.min': '密码至少6个字符',
        'any.required': '密码是必需的'
      }),
    name: Joi.string()
      .max(50)
      .required()
      .messages({
        'string.max': '姓名最多50个字符',
        'any.required': '姓名是必需的'
      })
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  req.body = value;
  next();
};

/**
 * 创建预警验证
 */
export const validateCreateAlert = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().required().max(200),
    description: Joi.string().max(1000),
    level: Joi.string().valid('critical', 'warning', 'info').required(),
    type: Joi.string().valid('wildlife-track', 'habitat-damage', 'water-quality', 'border-anomaly', 'infrared-trigger', 'vehicle-sneak').required(),
    category: Joi.string().valid('ecology', 'fooddrug', 'enforcement').required(),
    location: Joi.string().required(),
    latitude: Joi.number(),
    longitude: Joi.number(),
    risk_score: Joi.number().min(0).max(100),
    pollutant_type: Joi.string(),
    pollutant_value: Joi.number(),
    standard_value: Joi.number(),
    affected_population: Joi.number(),
    source: Joi.string().valid('device', 'manual', 'hotline', 'social_media', 'enterprise')
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  req.body = value;
  next();
};

/**
 * 创建任务验证
 */
export const validateCreateTask = (req, res, next) => {
  const schema = Joi.object({
    title: Joi.string().required().max(200),
    description: Joi.string().max(1000),
    type: Joi.string().valid('quick-sampling', 'complete-sampling', 'inspection', 'monitoring').required(),
    priority: Joi.string().valid('low', 'medium', 'high', 'urgent'),
    alert_id: Joi.string(),
    assigned_to: Joi.string().required(),
    location: Joi.string().required(),
    latitude: Joi.number(),
    longitude: Joi.number(),
    deadline: Joi.date()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  req.body = value;
  next();
};

/**
 * 添加设备验证
 */
export const validateCreateDevice = (req, res, next) => {
  const schema = Joi.object({
    device_id: Joi.string().required(),
    name: Joi.string().required().max(100),
    type: Joi.string().valid('camera-visible', 'camera-infrared', 'fiber', 'smell', 'water-monitor', 'air-monitor', 'soil-monitor').required(),
    location: Joi.string().required(),
    latitude: Joi.number().required(),
    longitude: Joi.number().required(),
    manufacturer: Joi.string(),
    model: Joi.string(),
    firmware_version: Joi.string()
  });

  const { error, value } = schema.validate(req.body);

  if (error) {
    return res.status(400).json({
      success: false,
      message: error.details[0].message
    });
  }

  req.body = value;
  next();
};
