# Mock Data for Trader Requests

This directory contains mock data and services for demonstrating the Trader Requests page functionality.

## Files

- **`traderRequestsMock.ts`** - Mock data generator and service implementation

## How to Use

### Enable Mock Data (Default)
The mock data is currently enabled by default. To use it:

1. The page will load with realistic sample data
2. All features will work including:
   - Pagination
   - Search functionality
   - Date filtering
   - Tab switching between Blendsheet/Flavorsheet
   - Print functionality

### Switch to Real API
To switch to the real API endpoints:

1. Open `src/api/services/traderRequests.service.ts`
2. Change `USE_MOCK_DATA = true` to `USE_MOCK_DATA = false`
3. Ensure the backend API endpoints are available:
   - `/analytics/trader-requests/blendsheet`
   - `/analytics/trader-requests/flavorsheet`

## Mock Data Features

### Generated Data
- **Blendsheet Requests**: 150 requests with realistic data
- **Flavorsheet Requests**: 85 requests with realistic data
- **Date Range**: Last 6 months of data
- **Realistic Values**: Entity numbers, batch codes, timestamps, statuses

### Status Distribution
- **TRADER_ALLOWED**: ~50% (approved requests)
- **TRADER_BLOCKED**: ~16% (blocked requests)
- **TRADER_ELEVATED**: ~16% (elevated to supervisor)
- **TRADER_REQUESTED**: ~16% (pending requests)

### Batch Information
- **Batches per Request**: 1-5 batches randomly
- **Lab Results**: Moisture content, bag IDs, storekeeper info
- **Item Codes**: Generated based on entity type and sequence

### Search & Filtering
- **Search**: Works across entity numbers, remarks, and batch codes
- **Date Filtering**: Month-based filtering with realistic date ranges
- **Pagination**: 25 items per page with proper meta information

## Sample Data Overview

### Blendsheet Examples
```
BLS20240001 - BLS20240150
Batch codes: BL0001XX, BL0002XX, etc.
```

### Flavorsheet Examples
```
FLS20240001 - FLS20240085
Batch codes: FL0001XX, FL0002XX, etc.
```

## Simulated Network Delays
The mock service includes realistic network delays (200-800ms) to simulate real API behavior for testing loading states and user interactions.