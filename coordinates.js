const hasCoordinateValue = (value) =>
  value !== undefined && value !== null && String(value).trim() !== '';

const parseOptionalCoordinates = (latitude, longitude) => {
  const hasLatitude = hasCoordinateValue(latitude);
  const hasLongitude = hasCoordinateValue(longitude);

  if (!hasLatitude && !hasLongitude) {
    return { latitude: null, longitude: null };
  }

  if (!hasLatitude || !hasLongitude) {
    const error = new Error('Latitude and longitude must be provided together');
    error.status = 400;
    throw error;
  }

  const parsedLatitude = Number(latitude);
  const parsedLongitude = Number(longitude);

  if (!Number.isFinite(parsedLatitude) || parsedLatitude < -90 || parsedLatitude > 90) {
    const error = new Error('Latitude must be a number between -90 and 90');
    error.status = 400;
    throw error;
  }

  if (!Number.isFinite(parsedLongitude) || parsedLongitude < -180 || parsedLongitude > 180) {
    const error = new Error('Longitude must be a number between -180 and 180');
    error.status = 400;
    throw error;
  }

  return {
    latitude: Number(parsedLatitude.toFixed(6)),
    longitude: Number(parsedLongitude.toFixed(6))
  };
};

module.exports = { parseOptionalCoordinates };
