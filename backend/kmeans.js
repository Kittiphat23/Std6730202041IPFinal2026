/**
 * 1D K-Means Clustering Algorithm for Salary Analysis
 * Formats results into Tier 1, Tier 2, Tier 3 sorted by centroid ascending.
 */

const calculateKMeans1D = (salariesInput, k = 3, maxIterations = 100) => {
  const validSalaries = (salariesInput || [])
    .map((val) => Number(val))
    .filter((num) => !Number.isNaN(num));

  // Edge case 1: No data available
  if (validSalaries.length === 0) {
    return [
      { group: 'Tier 1', centroid: 0, count: 0 },
      { group: 'Tier 2', centroid: 0, count: 0 },
      { group: 'Tier 3', centroid: 0, count: 0 },
    ];
  }

  // Edge case 2: Less data than k
  if (validSalaries.length <= k) {
    const sortedSalaries = [...validSalaries].sort((a, b) => a - b);
    const resultClusters = [];
    for (let index = 0; index < k; index++) {
      if (index < sortedSalaries.length) {
        resultClusters.push({
          group: `Tier ${index + 1}`,
          centroid: Math.round(sortedSalaries[index]),
          count: 1,
        });
      } else {
        resultClusters.push({
          group: `Tier ${index + 1}`,
          centroid: 0,
          count: 0,
        });
      }
    }
    return resultClusters;
  }

  // Standard K-Means 1D
  const sortedValues = [...validSalaries].sort((a, b) => a - b);
  const minVal = sortedValues[0];
  const maxVal = sortedValues[sortedValues.length - 1];

  // If all values are identical
  if (minVal === maxVal) {
    return [
      { group: 'Tier 1', centroid: Math.round(minVal), count: sortedValues.length },
      { group: 'Tier 2', centroid: Math.round(minVal), count: 0 },
      { group: 'Tier 3', centroid: Math.round(minVal), count: 0 },
    ];
  }

  // Initial Centroids: evenly distributed across sorted values
  let centroids = [
    sortedValues[Math.floor(sortedValues.length * 0.15)],
    sortedValues[Math.floor(sortedValues.length * 0.50)],
    sortedValues[Math.floor(sortedValues.length * 0.85)],
  ];

  for (let iter = 0; iter < maxIterations; iter++) {
    const clusters = [[], [], []];

    // Assign each point to the closest centroid
    for (let i = 0; i < sortedValues.length; i++) {
      const salaryVal = sortedValues[i];
      let closestCentroidIndex = 0;
      let minDistance = Math.abs(salaryVal - centroids[0]);

      for (let cIndex = 1; cIndex < k; cIndex++) {
        const distance = Math.abs(salaryVal - centroids[cIndex]);
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroidIndex = cIndex;
        }
      }

      clusters[closestCentroidIndex].push(salaryVal);
    }

    // Recompute centroids
    let hasConverged = true;
    const newCentroids = [...centroids];

    for (let cIndex = 0; cIndex < k; cIndex++) {
      const clusterItems = clusters[cIndex];
      if (clusterItems.length > 0) {
        const sum = clusterItems.reduce((acc, val) => acc + val, 0);
        const mean = sum / clusterItems.length;
        if (Math.abs(mean - centroids[cIndex]) > 0.001) {
          hasConverged = false;
        }
        newCentroids[cIndex] = mean;
      }
    }

    centroids = newCentroids;

    if (hasConverged) {
      break;
    }
  }

  // Final assignment with converged centroids
  const finalAssignments = [[], [], []];
  for (let i = 0; i < sortedValues.length; i++) {
    const salaryVal = sortedValues[i];
    let closestIndex = 0;
    let minDiff = Math.abs(salaryVal - centroids[0]);

    for (let cIndex = 1; cIndex < k; cIndex++) {
      const diff = Math.abs(salaryVal - centroids[cIndex]);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = cIndex;
      }
    }

    finalAssignments[closestIndex].push(salaryVal);
  }

  // Calculate actual centroid and count for each cluster
  const clusterResults = finalAssignments.map((items, idx) => {
    if (items.length > 0) {
      const sum = items.reduce((acc, val) => acc + val, 0);
      return {
        centroid: Math.round(sum / items.length),
        count: items.length,
      };
    }
    return {
      centroid: Math.round(centroids[idx]),
      count: 0,
    };
  });

  // Sort by centroid ascending (Tier 1 = lowest avg salary, Tier 3 = highest)
  clusterResults.sort((a, b) => a.centroid - b.centroid);

  // Map to Tier 1, Tier 2, Tier 3
  return clusterResults.map((item, index) => ({
    group: `Tier ${index + 1}`,
    centroid: item.centroid,
    count: item.count,
  }));
};

module.exports = {
  calculateKMeans1D,
};
