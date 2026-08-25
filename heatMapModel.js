const pool = require('../config/db');

const GRID_PRECISION = 2;

const normalizeCount = (value) => Math.max(0, Number(value) || 0);

const mergeAreas = (wasteRows, complaintRows) => {
  const areas = new Map();

  const addRows = (rows, countField) => {
    rows.forEach((row) => {
      const latitude = Number(row.latitude);
      const longitude = Number(row.longitude);
      const count = normalizeCount(row.recordCount);

      if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || count === 0) return;

      const key = `${latitude.toFixed(GRID_PRECISION)},${longitude.toFixed(GRID_PRECISION)}`;
      const area = areas.get(key) || {
        latitude,
        longitude,
        wasteCount: 0,
        complaintCount: 0,
        totalCount: 0
      };

      area[countField] += count;
      area.totalCount = area.wasteCount + area.complaintCount;
      areas.set(key, area);
    });
  };

  addRows(wasteRows, 'wasteCount');
  addRows(complaintRows, 'complaintCount');

  return Array.from(areas.values()).sort((a, b) => b.totalCount - a.totalCount);
};

const toSummary = (row = {}) => {
  const total = normalizeCount(row.totalCount);
  const mapped = Math.min(total, normalizeCount(row.mappedCount));
  return { total, mapped, unmapped: total - mapped };
};

const HeatMapModel = {
  async getAggregatedData() {
    const coordinateFilter = `latitude IS NOT NULL
      AND longitude IS NOT NULL
      AND latitude BETWEEN -90 AND 90
      AND longitude BETWEEN -180 AND 180`;

    const [wasteResult, complaintResult, wasteSummaryResult, complaintSummaryResult] =
      await Promise.all([
        pool.execute(
          `SELECT ROUND(latitude, ${GRID_PRECISION}) AS latitude,
                  ROUND(longitude, ${GRID_PRECISION}) AS longitude,
                  COUNT(*) AS recordCount
           FROM ScrapListings
           WHERE ${coordinateFilter}
           GROUP BY ROUND(latitude, ${GRID_PRECISION}), ROUND(longitude, ${GRID_PRECISION})`
        ),
        pool.execute(
          `SELECT ROUND(latitude, ${GRID_PRECISION}) AS latitude,
                  ROUND(longitude, ${GRID_PRECISION}) AS longitude,
                  COUNT(*) AS recordCount
           FROM PollutionComplaints
           WHERE ${coordinateFilter}
           GROUP BY ROUND(latitude, ${GRID_PRECISION}), ROUND(longitude, ${GRID_PRECISION})`
        ),
        pool.execute(
          `SELECT COUNT(*) AS totalCount,
                  COALESCE(SUM(${coordinateFilter}), 0) AS mappedCount
           FROM ScrapListings`
        ),
        pool.execute(
          `SELECT COUNT(*) AS totalCount,
                  COALESCE(SUM(${coordinateFilter}), 0) AS mappedCount
           FROM PollutionComplaints`
        )
      ]);

    const wasteRows = wasteResult[0];
    const complaintRows = complaintResult[0];
    const waste = toSummary(wasteSummaryResult[0][0]);
    const complaints = toSummary(complaintSummaryResult[0][0]);

    return {
      generatedAt: new Date().toISOString(),
      gridPrecision: GRID_PRECISION,
      gridCellNote: 'Coordinates are grouped to approximately 1 km cells for privacy.',
      summary: {
        wasteListings: waste,
        pollutionComplaints: complaints,
        mappedRecords: waste.mapped + complaints.mapped,
        unmappedRecords: waste.unmapped + complaints.unmapped
      },
      areas: mergeAreas(wasteRows, complaintRows)
    };
  },

  mergeAreas
};

module.exports = HeatMapModel;
