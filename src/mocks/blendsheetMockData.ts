// Mock blendsheet operations data for dev panel testing
// Based on real API response structure
import type { MockBlendsheetBatchData, MockBlendsheetData, TealineMixtureItem, MixtureAllocations, BatchAllocation } from '../types/blendsheet';

function generateMockBatch(
  batchIndex: number,
  blendsheetNo: string,
  createdDate: Date,
  targetBlendInWeight: number,
  actualBlendInWeight: number
): MockBlendsheetBatchData {
  const targetBlendIn = targetBlendInWeight;
  const actualBlendIn = actualBlendInWeight;

  const formatDateTime = (date: Date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  // Calculate timing data
  const blendInStartDelay = Math.floor(Math.random() * 25 + 5);
  const blendInStart = new Date(createdDate.getTime() + blendInStartDelay * 60 * 1000);
  const blendInDuration = Math.floor(Math.random() * 20 + 10);
  const blendInEnd = new Date(blendInStart.getTime() + blendInDuration * 60 * 1000);
  const blendOutDelay = Math.floor(Math.random() * 25 + 20);
  const blendOutStart = new Date(blendInEnd.getTime() + blendOutDelay * 60 * 1000);
  const blendOutDuration = Math.floor(Math.random() * 45 + 15);
  const blendOutEnd = new Date(blendOutStart.getTime() + blendOutDuration * 60 * 1000);

  let status: 'ALLOCATE' | 'RECEIVE' | 'COMPLETED';
  let blendInTimeValue, targetBlendOut, actualBlendOut, blendOutTimeValue;

  // Determine status based on how close we got to target
  const fulfillmentRatio = actualBlendIn / targetBlendIn;

  if (fulfillmentRatio < 0.95) {
    // ALLOCATE: Didn't reach target (less than 95%)
    status = 'ALLOCATE';
    blendInTimeValue = null;
    targetBlendOut = null;
    actualBlendOut = null;
    blendOutTimeValue = null;
  } else {
    // Blend-in target reached, proceed to RECEIVE/COMPLETED
    blendInTimeValue = `${formatDateTime(blendInStart)} - ${formatDateTime(blendInEnd)}`;

    const blendOutVariance = 0.001 + Math.random() * 0.019; // 0.1-2% loss
    targetBlendOut = Math.floor(actualBlendIn * (1 - blendOutVariance) * 100) / 100;

    // 30% RECEIVE, 70% COMPLETED
    if (Math.random() > 0.70) {
      // RECEIVE: Partial blend-out
      const partialPercentage = Math.random() * 0.99;
      actualBlendOut = Math.floor(targetBlendOut * partialPercentage * 100) / 100;
      status = 'RECEIVE';
      blendOutTimeValue = null;
    } else {
      // COMPLETED: Full blend-out
      actualBlendOut = targetBlendOut;
      status = 'COMPLETED';
      blendOutTimeValue = `${formatDateTime(blendOutStart)} - ${formatDateTime(blendOutEnd)}`;
    }
  }

  return {
    item_code: `${blendsheetNo}/${batchIndex + 1}`,
    created_ts: createdDate,
    blend_in_weight: actualBlendIn,
    blend_in_time: blendInTimeValue,
    blend_out_weight: actualBlendOut,
    blend_out_time: blendOutTimeValue,
    status: status,
    target_blend_in_weight: targetBlendIn,
    target_blend_out_weight: targetBlendOut,
    allocations: [],
  };
}

// Generate mock mixture data based on ACTUAL database structure
// Real data from grandpass-dev database:
// - Tealine: Stored as mixture_code + no_of_bags (NOT weight!)
//   - 1-11 mixture items per blendsheet, 1-247 total bags
//   - Item codes: T240487, I230066
// - Blendbalance: Stored as mixture_code + weight (kg)
//   - 1-10 mixture items, 8-1230 kg per item
//   - Item codes: BS/2024/0533/1
function generateMockMixtureAllocations(): MixtureAllocations {
  // Tealine mixture: ALWAYS has 1-11 mixture items (required for all blendsheets)
  const tealineCount = Math.floor(Math.random() * 10) + 1; // 1-11 items (guaranteed at least 1)
  const tealine: Record<string, TealineMixtureItem> = {};

  for (let i = 0; i < tealineCount; i++) {
    // Real pattern: T240487, I230066
    const prefix = Math.random() > 0.5 ? 'T' : 'I';
    const year = 24 + Math.floor(Math.random() * 2); // 24 or 25
    const sequence = String(Math.floor(Math.random() * 2000)).padStart(4, '0');
    const mixtureCode = `${prefix}${year}${sequence}`;

    // Number of bags: typically 1-30 per item, occasionally up to 100
    const noOfBags = Math.random() > 0.9
      ? Math.floor(Math.random() * 70) + 30  // 30-100 bags (10%)
      : Math.floor(Math.random() * 30) + 1;   // 1-30 bags (90%)

    // Weight per bag: 60-80 kg (random per item)
    const weightPerBag = Math.floor(Math.random() * 20 + 60); // 60-80 kg

    tealine[mixtureCode] = {
      no_of_bags: noOfBags,
      weight_per_bag: weightPerBag
    };
  }

  // Blendbalance mixture: Not always present, 1-10 items with weights
  const blendbalance: Record<string, number> = {};
  if (Math.random() > 0.4) { // 60% chance of having blendbalance
    const blendbalanceCount = Math.floor(Math.random() * 10) + 1; // 1-10 items
    for (let i = 0; i < blendbalanceCount; i++) {
      // Real pattern: BS/2024/0533/1
      const year = 2024 + Math.floor(Math.random() * 2);
      const blendsheetNo = String(Math.floor(Math.random() * 600) + 100).padStart(4, '0');
      const batchNo = Math.floor(Math.random() * 5) + 1;
      const mixtureCode = `BS/${year}/${blendsheetNo}/${batchNo}`;

      // Weight: 8-1230 kg, but mostly 35-226 kg
      const weight = Math.random() > 0.8
        ? Math.floor((8 + Math.random() * 1222) * 100) / 100  // 8-1230 kg (20%)
        : Math.floor((35 + Math.random() * 191) * 100) / 100; // 35-226 kg (80%)
      blendbalance[mixtureCode] = weight;
    }
  }

  // Officesample: No records in database
  const officesample: Record<string, number> = {};

  // Blendsheet: Not found in database structure
  const blendsheet: Record<string, number> = {};

  return { tealine, blendbalance, officesample, blendsheet };
}

// Distribute allocations equally across all batches
function distributeAllocationsEqually(
  mixtures: MixtureAllocations,
  numberOfBatches: number,
  _blendsheetNo: string,
  batchCreatedDate: Date
): BatchAllocation[][] {
  const batchAllocations: BatchAllocation[][] = Array.from({ length: numberOfBatches }, () => []);

  if (numberOfBatches === 0) return batchAllocations;

  const formatDateTime = (date: Date) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  };

  // Distribute tealine: divide each item equally across batches
  // Create individual bag allocation records
  Object.entries(mixtures.tealine).forEach(([code, item]) => {
    const bagsPerBatch = item.no_of_bags / numberOfBatches;
    const fullBagsPerBatch = Math.floor(bagsPerBatch);
    const fractionalBag = bagsPerBatch - fullBagsPerBatch;

    for (let batchIndex = 0; batchIndex < numberOfBatches; batchIndex++) {
      // Add full bags
      for (let bagNum = 0; bagNum < fullBagsPerBatch; bagNum++) {
        const sourceCreatedOffset = Math.floor(Math.random() * 30 + 7);
        const sourceCreatedDate = new Date(
          batchCreatedDate.getTime() - sourceCreatedOffset * 24 * 60 * 60 * 1000
        );
        const allocatedOffset = Math.floor(Math.random() * 20 + 5);
        const allocatedDate = new Date(
          batchCreatedDate.getTime() + allocatedOffset * 60 * 1000
        );

        batchAllocations[batchIndex].push({
          id: crypto.randomUUID(),
          source_type: 'tealine',
          source_item_code: code,
          source_created_ts: formatDateTime(sourceCreatedDate),
          allocated_weight: item.weight_per_bag,
          allocated_at: formatDateTime(allocatedDate),
          grade: generateTeaGrade(),
          notes: `1 bag × ${item.weight_per_bag} kg/bag`,
        });
      }

      // Add fractional bag if exists
      if (fractionalBag > 0) {
        const fractionalWeight = Math.round(fractionalBag * item.weight_per_bag * 100) / 100;
        const sourceCreatedOffset = Math.floor(Math.random() * 30 + 7);
        const sourceCreatedDate = new Date(
          batchCreatedDate.getTime() - sourceCreatedOffset * 24 * 60 * 60 * 1000
        );
        const allocatedOffset = Math.floor(Math.random() * 20 + 5);
        const allocatedDate = new Date(
          batchCreatedDate.getTime() + allocatedOffset * 60 * 1000
        );

        batchAllocations[batchIndex].push({
          id: crypto.randomUUID(),
          source_type: 'tealine',
          source_item_code: code,
          source_created_ts: formatDateTime(sourceCreatedDate),
          allocated_weight: fractionalWeight,
          allocated_at: formatDateTime(allocatedDate),
          grade: generateTeaGrade(),
          notes: `${Math.round(fractionalBag * 100) / 100} bags × ${item.weight_per_bag} kg/bag`,
        });
      }
    }
  });

  // Distribute blendbalance equally across batches with 80kg max per bag
  Object.entries(mixtures.blendbalance).forEach(([code, totalWeight]) => {
    const weightPerBatch = totalWeight / numberOfBatches;
    const MAX_BAG_WEIGHT = 80;

    for (let batchIndex = 0; batchIndex < numberOfBatches; batchIndex++) {
      // Calculate minimum bags needed
      const minBags = Math.ceil(weightPerBatch / MAX_BAG_WEIGHT);

      // Randomly choose bag count, exponentially biased towards minimum
      // Using Math.pow(Math.random(), 2) to bias towards lower values
      const extraBags = Math.floor(Math.pow(Math.random(), 2) * 3); // 0-2 extra bags, biased to 0
      const numBags = minBags + extraBags;

      // Distribute weight across bags with variance
      const baseWeightPerBag = weightPerBatch / numBags;
      let remainingWeight = weightPerBatch;

      for (let bagNum = 0; bagNum < numBags; bagNum++) {
        const isLastBag = bagNum === numBags - 1;

        let bagWeight;
        if (isLastBag) {
          // Last bag gets remaining weight
          bagWeight = Math.round(remainingWeight * 100) / 100;
        } else {
          // Add ±10% variance to base weight
          const variance = (Math.random() - 0.5) * 0.2; // -10% to +10%
          const variedWeight = baseWeightPerBag * (1 + variance);
          // Ensure bag doesn't exceed 80kg
          bagWeight = Math.min(Math.round(variedWeight * 100) / 100, MAX_BAG_WEIGHT);
        }

        const sourceCreatedOffset = Math.floor(Math.random() * 30 + 7);
        const sourceCreatedDate = new Date(
          batchCreatedDate.getTime() - sourceCreatedOffset * 24 * 60 * 60 * 1000
        );
        const allocatedOffset = Math.floor(Math.random() * 20 + 5);
        const allocatedDate = new Date(
          batchCreatedDate.getTime() + allocatedOffset * 60 * 1000
        );

        batchAllocations[batchIndex].push({
          id: crypto.randomUUID(),
          source_type: 'blendbalance',
          source_item_code: code,
          source_created_ts: formatDateTime(sourceCreatedDate),
          allocated_weight: bagWeight,
          allocated_at: formatDateTime(allocatedDate),
          notes: undefined,
        });

        remainingWeight -= bagWeight;
      }
    }
  });

  return batchAllocations;
}

// Generate batch allocations from available mixture items
function generateTeaGrade(): string {
  const grades = ['BOPF', 'BOP', 'FBOP', 'PEKOE', 'OP', 'DUST'];
  return grades[Math.floor(Math.random() * grades.length)];
}

/**
 * Calculate total planned weight from mixture allocations
 * @param mixtures - Mixture allocations with tealine, blendbalance, etc.
 * @returns Total weight in kg (rounded to 2 decimals)
 */
function calculatePlannedWeightFromMixtures(mixtures: MixtureAllocations): number {
  // Tealine: sum(bags × weight_per_bag)
  const tealineWeight = Object.values(mixtures.tealine).reduce(
    (sum, item) => sum + (item.no_of_bags * item.weight_per_bag),
    0
  );

  // Blendbalance: sum(weights in kg)
  const blendbalanceWeight = Object.values(mixtures.blendbalance).reduce(
    (sum, weight) => sum + weight,
    0
  );

  // Officesample: sum(weights) - currently always 0
  const officesampleWeight = Object.values(mixtures.officesample).reduce(
    (sum, weight) => sum + weight,
    0
  );

  // Blendsheet: sum(weights) - currently always 0
  const blendsheetWeight = Object.values(mixtures.blendsheet).reduce(
    (sum, weight) => sum + weight,
    0
  );

  const totalWeight = tealineWeight + blendbalanceWeight + officesampleWeight + blendsheetWeight;

  // Round to 2 decimal places for consistency
  return Math.floor(totalWeight * 100) / 100;
}

function generateMockBlendsheet(index: number): MockBlendsheetData {
  const year = 2025;
  const blendsheetNo = `BS/${year}/${String(600 + index).padStart(4, '0')}`;

  const blendCodes = [
    'BLT00148',
    'BLT00128',
    'BTL00364',
    'BLT00256',
    'BTL00189',
    'BLT00312',
  ];

  const remarks = [
    'FOR JING VINTAGE IMPERIAL TEA',
    'JING CEYLON BREAKFAST',
    'FOR JING ASSAM BREAKFAST 50 TB',
    'Standard blend for export',
    'Premium quality mix',
    'High-grade blend',
  ];

  // Step 1: Generate mixture allocations FIRST
  // ALL blendsheets have mixture data (including drafts) - mixture comes before batches
  const mixture_allocations = generateMockMixtureAllocations();

  // Step 2: Calculate planned weight FROM mixtures
  const plannedWeight = calculatePlannedWeightFromMixtures(mixture_allocations);

  // Step 3: Generate number of batches
  const noOfBatches = Math.floor(Math.random() * 4) + 1; // 1-5 batches

  // Step 4: Distribute planned weight exactly evenly across all batches (no variance)
  // All batches should have equal blend-in weights that sum to planned weight
  const batchBlendInWeights: number[] = [];
  const weightPerBatch = Math.floor((plannedWeight / noOfBatches) * 100) / 100; // Rounded to 2 decimals
  let remainingWeight = plannedWeight;

  for (let i = 0; i < noOfBatches; i++) {
    if (i === noOfBatches - 1) {
      // Last batch gets exactly the remaining weight to ensure sum = planned weight
      batchBlendInWeights.push(Math.floor(remainingWeight * 100) / 100);
    } else {
      // All other batches get equal weight (no variance)
      batchBlendInWeights.push(weightPerBatch);
      remainingWeight -= weightPerBatch;
    }
  }

  // Step 5: Distribute dates across different time ranges to ensure all tabs have data
  // - 30% in last 7 days (this week)
  // - 30% in last 30 days (this month)
  // - 25% in last 90 days (this year)
  // - 15% in last 365 days (lifetime/earlier this year)
  let daysAgo: number;
  const random = Math.random();
  if (random < 0.3) {
    // Last 7 days
    daysAgo = Math.floor(Math.random() * 7);
  } else if (random < 0.6) {
    // 8-30 days ago
    daysAgo = Math.floor(Math.random() * 23) + 7;
  } else if (random < 0.85) {
    // 31-90 days ago
    daysAgo = Math.floor(Math.random() * 60) + 30;
  } else {
    // 91-365 days ago
    daysAgo = Math.floor(Math.random() * 275) + 90;
  }

  const createdDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);

  // Step 6: Reduce drafts to 10% (was 20%) to ensure more data for time range tabs
  const batchesCreated = Math.random() > 0.1 ? Math.floor(Math.random() * (noOfBatches + 1)) : 0;

  // Step 7: Generate batches with equally distributed allocations
  // Distribute materials equally across ALL planned batches (noOfBatches, not batchesCreated)
  const batchAllocations = distributeAllocationsEqually(
    mixture_allocations,
    noOfBatches,
    blendsheetNo,
    createdDate
  );

  const batches = batchBlendInWeights.slice(0, batchesCreated).map((weight, i) => {
    const allocations = batchAllocations[i];

    // Calculate actual allocated weight
    const actualAllocatedWeight = allocations.reduce(
      (sum, alloc) => sum + alloc.allocated_weight,
      0
    );

    // Generate batch with actual allocated weight
    const batch = generateMockBatch(
      i,
      blendsheetNo,
      createdDate,
      weight,
      actualAllocatedWeight
    );

    return {
      ...batch,
      allocations,
    };
  });

  return {
    blendsheet_no: blendsheetNo,
    blend_code: blendCodes[Math.floor(Math.random() * blendCodes.length)],
    remarks: remarks[Math.floor(Math.random() * remarks.length)],
    planned_weight: plannedWeight,
    no_of_batches: noOfBatches,
    batches: batches,
    mixture_allocations: mixture_allocations,
  };
}

// Generate 50 blendsheets (more data for better variety)
const allBlendsheets = Array.from({ length: 50 }, (_, i) => generateMockBlendsheet(i));

// Calculate totals
const totalPlannedWeight = allBlendsheets.reduce((sum, bs) => sum + bs.planned_weight, 0);
const totalBlendInWeight = allBlendsheets.reduce(
  (sum, bs) => sum + bs.batches.reduce((bSum, b) => bSum + b.blend_in_weight, 0),
  0
);
const totalBlendOutWeight = allBlendsheets.reduce(
  (sum, bs) => sum + bs.batches.reduce((bSum, b) => bSum + (b.blend_out_weight || 0), 0),
  0
);

export const mockBlendsheetData = {
  success: true,
  data: allBlendsheets,
  meta: {
    total_items: 50,
    current_page_items: 25,
    total_blendsheets: 50,
    total_planned_weight: totalPlannedWeight,
    total_blend_in_weight: totalBlendInWeight,
    total_blend_out_weight: totalBlendOutWeight,
    pagination: {
      limit: 25,
      offset: 0,
      total_count: 50,
      total_pages: 2,
      current_page: 1,
      has_next: true,
      has_previous: false,
    },
  },
};

// Helper function to filter data by time range
function filterByTimeRange(data: MockBlendsheetData[], timeRange: 'this_week' | 'this_month' | 'this_year' | 'lifetime'): MockBlendsheetData[] {
  if (timeRange === 'lifetime') {
    return data;
  }

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let rangeStart: number;

  switch (timeRange) {
    case 'this_week':
      const dayOfWeek = today.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      const monday = new Date(today);
      monday.setDate(today.getDate() - daysToMonday);
      rangeStart = monday.getTime();
      break;
    case 'this_month':
      rangeStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      break;
    case 'this_year':
      rangeStart = new Date(now.getFullYear(), 0, 1).getTime();
      break;
    default:
      rangeStart = 0;
  }

  return data.filter(bs => {
    if (bs.batches.length === 0) return false;
    const earliestBatch = bs.batches.reduce((earliest: MockBlendsheetBatchData, current: MockBlendsheetBatchData) => {
      const earliestTime = new Date(earliest.created_ts).getTime();
      const currentTime = new Date(current.created_ts).getTime();
      return currentTime < earliestTime ? current : earliest;
    });
    const createdDate = new Date(earliestBatch.created_ts).getTime();
    return createdDate >= rangeStart;
  });
}

// Helper function to calculate totals for a dataset
function calculateTotals(data: MockBlendsheetData[]) {
  return {
    total_blendsheets: data.length,
    total_planned_weight: data.reduce((sum, bs) => sum + bs.planned_weight, 0),
    total_blend_in_weight: data.reduce(
      (sum, bs) => sum + bs.batches.reduce((bSum: number, b: MockBlendsheetBatchData) => bSum + b.blend_in_weight, 0),
      0
    ),
    total_blend_out_weight: data.reduce(
      (sum, bs) => sum + bs.batches.reduce((bSum: number, b: MockBlendsheetBatchData) => bSum + (b.blend_out_weight || 0), 0),
      0
    ),
  };
}

// Function to get paginated mock data
export function getMockBlendsheetData(page = 1, limit = 25) {
  const offset = (page - 1) * limit;

  // Sort by blendsheet_no descending (most recent first)
  const allData = [...mockBlendsheetData.data].sort((a, b) =>
    b.blendsheet_no.localeCompare(a.blendsheet_no)
  );

  const paginatedData = allData.slice(offset, offset + limit);

  // Calculate totals for all time ranges at once
  const timeRanges: Array<'this_week' | 'this_month' | 'this_year' | 'lifetime'> = ['this_week', 'this_month', 'this_year', 'lifetime'];
  const timeRangeMetrics: Record<string, ReturnType<typeof calculateTotals>> = {};

  timeRanges.forEach(range => {
    const filteredData = filterByTimeRange(allData, range);
    timeRangeMetrics[range] = calculateTotals(filteredData);
  });

  return {
    success: true,
    data: paginatedData,
    meta: {
      total_items: allData.length,
      current_page_items: paginatedData.length,
      time_ranges: timeRangeMetrics, // All time range metrics in one object
      pagination: {
        limit,
        offset,
        total_count: allData.length,
        total_pages: Math.ceil(allData.length / limit),
        current_page: page,
        has_next: offset + limit < allData.length,
        has_previous: offset > 0,
      },
    },
  };
}
