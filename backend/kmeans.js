/**
 * 1D K-Means Clustering Algorithm for Salary Analysis
 * Formats results into Tier 1, Tier 2, Tier 3 sorted by centroid ascending.
 */

const calculateKMeans1DTHONGPHUM = (salariesInputTHONGPHUM, kTHONGPHUM = 3, maxIterationsTHONGPHUM = 100) => {
  const validSalariesTHONGPHUM = (salariesInputTHONGPHUM || [])
    .map((valTHONGPHUM) => Number(valTHONGPHUM))
    .filter((numTHONGPHUM) => !Number.isNaN(numTHONGPHUM));

  // Edge case 1: No data available
  if (validSalariesTHONGPHUM.length === 0) {
    return [
      { group: 'Tier 1', centroid: 0, count: 0 },
      { group: 'Tier 2', centroid: 0, count: 0 },
      { group: 'Tier 3', centroid: 0, count: 0 },
    ];
  }

  // Edge case 2: Less data than k
  if (validSalariesTHONGPHUM.length <= kTHONGPHUM) {
    const sortedSalariesTHONGPHUM = [...validSalariesTHONGPHUM].sort((aTHONGPHUM, bTHONGPHUM) => aTHONGPHUM - bTHONGPHUM);
    const resultClustersTHONGPHUM = [];
    for (let indexTHONGPHUM = 0; indexTHONGPHUM < kTHONGPHUM; indexTHONGPHUM++) {
      if (indexTHONGPHUM < sortedSalariesTHONGPHUM.length) {
        resultClustersTHONGPHUM.push({
          group: `Tier ${indexTHONGPHUM + 1}`,
          centroid: Math.round(sortedSalariesTHONGPHUM[indexTHONGPHUM]),
          count: 1,
        });
      } else {
        resultClustersTHONGPHUM.push({
          group: `Tier ${indexTHONGPHUM + 1}`,
          centroid: 0,
          count: 0,
        });
      }
    }
    return resultClustersTHONGPHUM;
  }

  // Standard K-Means 1D
  const sortedValuesTHONGPHUM = [...validSalariesTHONGPHUM].sort((aTHONGPHUM, bTHONGPHUM) => aTHONGPHUM - bTHONGPHUM);
  const minValTHONGPHUM = sortedValuesTHONGPHUM[0];
  const maxValTHONGPHUM = sortedValuesTHONGPHUM[sortedValuesTHONGPHUM.length - 1];

  // If all values are identical
  if (minValTHONGPHUM === maxValTHONGPHUM) {
    return [
      { group: 'Tier 1', centroid: Math.round(minValTHONGPHUM), count: sortedValuesTHONGPHUM.length },
      { group: 'Tier 2', centroid: Math.round(minValTHONGPHUM), count: 0 },
      { group: 'Tier 3', centroid: Math.round(minValTHONGPHUM), count: 0 },
    ];
  }

  // Initial Centroids: evenly distributed across sorted values
  let centroidsTHONGPHUM = [
    sortedValuesTHONGPHUM[Math.floor(sortedValuesTHONGPHUM.length * 0.15)],
    sortedValuesTHONGPHUM[Math.floor(sortedValuesTHONGPHUM.length * 0.50)],
    sortedValuesTHONGPHUM[Math.floor(sortedValuesTHONGPHUM.length * 0.85)],
  ];

  for (let iterTHONGPHUM = 0; iterTHONGPHUM < maxIterationsTHONGPHUM; iterTHONGPHUM++) {
    const clustersTHONGPHUM = [[], [], []];

    // Assign each point to the closest centroid
    for (let iTHONGPHUM = 0; iTHONGPHUM < sortedValuesTHONGPHUM.length; iTHONGPHUM++) {
      const salaryValTHONGPHUM = sortedValuesTHONGPHUM[iTHONGPHUM];
      let closestCentroidIndexTHONGPHUM = 0;
      let minDistanceTHONGPHUM = Math.abs(salaryValTHONGPHUM - centroidsTHONGPHUM[0]);

      for (let cIndexTHONGPHUM = 1; cIndexTHONGPHUM < kTHONGPHUM; cIndexTHONGPHUM++) {
        const distanceTHONGPHUM = Math.abs(salaryValTHONGPHUM - centroidsTHONGPHUM[cIndexTHONGPHUM]);
        if (distanceTHONGPHUM < minDistanceTHONGPHUM) {
          minDistanceTHONGPHUM = distanceTHONGPHUM;
          closestCentroidIndexTHONGPHUM = cIndexTHONGPHUM;
        }
      }

      clustersTHONGPHUM[closestCentroidIndexTHONGPHUM].push(salaryValTHONGPHUM);
    }

    // Recompute centroids
    let hasConvergedTHONGPHUM = true;
    const newCentroidsTHONGPHUM = [...centroidsTHONGPHUM];

    for (let cIndexTHONGPHUM = 0; cIndexTHONGPHUM < kTHONGPHUM; cIndexTHONGPHUM++) {
      const clusterItemsTHONGPHUM = clustersTHONGPHUM[cIndexTHONGPHUM];
      if (clusterItemsTHONGPHUM.length > 0) {
        const sumTHONGPHUM = clusterItemsTHONGPHUM.reduce((accTHONGPHUM, valTHONGPHUM) => accTHONGPHUM + valTHONGPHUM, 0);
        const meanTHONGPHUM = sumTHONGPHUM / clusterItemsTHONGPHUM.length;
        if (Math.abs(meanTHONGPHUM - centroidsTHONGPHUM[cIndexTHONGPHUM]) > 0.001) {
          hasConvergedTHONGPHUM = false;
        }
        newCentroidsTHONGPHUM[cIndexTHONGPHUM] = meanTHONGPHUM;
      }
    }

    centroidsTHONGPHUM = newCentroidsTHONGPHUM;

    if (hasConvergedTHONGPHUM) {
      break;
    }
  }

  // Final assignment with the converged centroids
  const finalAssignmentsTHONGPHUM = [[], [], []];
  for (let iTHONGPHUM = 0; iTHONGPHUM < sortedValuesTHONGPHUM.length; iTHONGPHUM++) {
    const salaryValTHONGPHUM = sortedValuesTHONGPHUM[iTHONGPHUM];
    let closestIndexTHONGPHUM = 0;
    let minDiffTHONGPHUM = Math.abs(salaryValTHONGPHUM - centroidsTHONGPHUM[0]);

    for (let cIndexTHONGPHUM = 1; cIndexTHONGPHUM < kTHONGPHUM; cIndexTHONGPHUM++) {
      const diffTHONGPHUM = Math.abs(salaryValTHONGPHUM - centroidsTHONGPHUM[cIndexTHONGPHUM]);
      if (diffTHONGPHUM < minDiffTHONGPHUM) {
        minDiffTHONGPHUM = diffTHONGPHUM;
        closestIndexTHONGPHUM = cIndexTHONGPHUM;
      }
    }

    finalAssignmentsTHONGPHUM[closestIndexTHONGPHUM].push(salaryValTHONGPHUM);
  }

  // Calculate actual centroid and count for each cluster
  const clusterResultsTHONGPHUM = finalAssignmentsTHONGPHUM.map((itemsTHONGPHUM, idxTHONGPHUM) => {
    if (itemsTHONGPHUM.length > 0) {
      const sumTHONGPHUM = itemsTHONGPHUM.reduce((accTHONGPHUM, valTHONGPHUM) => accTHONGPHUM + valTHONGPHUM, 0);
      return {
        centroid: Math.round(sumTHONGPHUM / itemsTHONGPHUM.length),
        count: itemsTHONGPHUM.length,
      };
    }
    return {
      centroid: Math.round(centroidsTHONGPHUM[idxTHONGPHUM]),
      count: 0,
    };
  });

  // Sort by centroid ascending (Tier 1 = lowest avg salary, Tier 3 = highest)
  clusterResultsTHONGPHUM.sort((aTHONGPHUM, bTHONGPHUM) => aTHONGPHUM.centroid - bTHONGPHUM.centroid);

  // Map to Tier 1, Tier 2, Tier 3
  return clusterResultsTHONGPHUM.map((itemTHONGPHUM, indexTHONGPHUM) => ({
    group: `Tier ${indexTHONGPHUM + 1}`,
    centroid: itemTHONGPHUM.centroid,
    count: itemTHONGPHUM.count,
  }));
};

module.exports = {
  calculateKMeans1DTHONGPHUM,
};
