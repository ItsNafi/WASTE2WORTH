const CERTIFICATE_MILESTONES = Object.freeze([
  Object.freeze({
    key: 'eco-warrior',
    title: 'Eco-Warrior',
    threshold: 1000,
    recognition:
      'In recognition of meaningful action for recycling, cleaner communities, and a more circular economy.'
  }),
  Object.freeze({
    key: 'sustainability-champion',
    title: 'Sustainability Champion',
    threshold: 5000,
    recognition:
      'In recognition of exceptional and sustained environmental action through the WASTE2WORTH community.'
  })
]);

const getMilestoneByKey = (key) =>
  CERTIFICATE_MILESTONES.find((milestone) => milestone.key === key) || null;

const getAchievedMilestones = (greenPoints) => {
  const points = Math.max(0, Number(greenPoints) || 0);
  return CERTIFICATE_MILESTONES.filter((milestone) => points >= milestone.threshold);
};

module.exports = {
  CERTIFICATE_MILESTONES,
  getMilestoneByKey,
  getAchievedMilestones
};
