export function calculateRiskScore(input = {}) {
  const {
    category = 'ecology',
    anomaly_score = 0,
    confidence = 0.6,
    device_status = 'online',
    target_type = 'unknown',
    historical_case_count = 0,
    affected_population = 0
  } = input;

  const baseByCategory = {
    smuggling: 48,
    ecology: 30,
    fooddrug: 28
  };

  let score = baseByCategory[category] ?? 25;
  score += Math.min(25, Number(anomaly_score) || 0);
  score += Math.round(Math.min(12, (Number(confidence) || 0) * 12));

  if (device_status === 'warning') score += 5;
  if (device_status === 'error') score += 8;

  if (target_type === 'animal' || target_type === 'vehicle') score += 6;
  score += Math.min(8, Number(historical_case_count) || 0);

  if (category !== 'smuggling') {
    score += Math.min(6, Math.floor((Number(affected_population) || 0) / 500));
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function mapRiskLevel(score, category = 'ecology') {
  if (category === 'smuggling') {
    if (score >= 85) return 'critical';
    if (score >= 60) return 'warning';
    return 'info';
  }

  if (score >= 80) return 'critical';
  if (score >= 55) return 'warning';
  return 'info';
}
