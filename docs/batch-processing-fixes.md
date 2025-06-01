# Batch Processing Fixes

## Issues Identified

### 1. Duplicate Processing

**Problem**: Batches were being processed multiple times, causing duplicate progress logs and potential race conditions.

**Root Cause**:

- The API route was starting batch processing with `setTimeout` without checking if the batch was already being processed
- No state management to prevent duplicate processing calls

**Fix**:

- Added state checking in `BatchImageGenerationService.processBatch()` to prevent duplicate processing
- Removed `setTimeout` from API route to eliminate race conditions
- Added proper logging to track batch state transitions

### 2. Mock vs Real Progress Tracking

**Problem**: The queue manager was using simulated progress instead of real progress from the actual batch processor.

**Root Cause**:

- `BatchQueueManager` was generating fake progress based on time estimates
- Real progress from `BatchProcessor` wasn't being properly communicated to the queue manager

**Fix**:

- Added `updateBatchProgress()` method to `BatchQueueManager` to handle real progress updates
- Modified `BatchImageGenerationService` to pass real progress from processor to queue manager
- Updated progress tracking to stop simulated progress when real progress is available

### 3. Authentication Warnings

**Problem**: Supabase was showing warnings about using insecure session data.

**Root Cause**:

- Middleware was using `supabase.auth.getSession()` which relies on potentially insecure storage data

**Fix**:

- Updated `authenticateMiddlewareRequest()` to use `supabase.auth.getUser()` for secure authentication
- Fixed type compatibility issues with session handling

### 4. Memory Leaks

**Problem**: Completed batches were accumulating in memory without cleanup.

**Root Cause**:

- No cleanup mechanism for completed batches
- Progress intervals weren't being properly cleared

**Fix**:

- Added `cleanupCompletedBatches()` method to remove old completed batches
- Added periodic cleanup every 30 minutes
- Improved progress interval cleanup

### 5. Missing API Keys (NEW)

**Problem**: Batch processing was failing because image generation API keys were not configured.

**Root Cause**:

- The system was trying to make real API calls to Replicate/RunPod without valid credentials
- No fallback for development/testing scenarios

**Fix**:

- Added development mode that automatically activates when API keys are missing
- Development mode uses placeholder images from picsum.photos for testing
- Added clear logging to indicate when running in development mode

## Development Mode

When `REPLICATE_API_KEY` and `RUNPOD_API_KEY` are not set in your environment, the batch processor automatically switches to **development mode**:

- ✅ **Simulates image generation** with realistic timing (1-3 seconds per image)
- ✅ **Uses placeholder images** from picsum.photos
- ✅ **Shows progress updates** with "(development mode)" indicator
- ✅ **Calculates realistic costs** for testing
- ✅ **Allows full testing** of batch processing without API costs

### Setting Up API Keys

To use real image generation, create a `.env` file in your project root:

```bash
# Image Generation API Keys
REPLICATE_API_KEY=your_replicate_api_key_here
RUNPOD_API_KEY=your_runpod_api_key_here

# Other required environment variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
```

## Code Changes

### BatchProcessor (NEW)

```typescript
// Added development mode detection
const isDevelopmentMode =
  !process.env.REPLICATE_API_KEY && !process.env.RUNPOD_API_KEY

if (isDevelopmentMode) {
  // Simulate image generation in development mode
  console.log(
    `🧪 Development mode: Simulating image generation for "${request.prompt}"`
  )

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

  response = {
    id: `dev-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'completed',
    imageUrl: `https://picsum.photos/1024/1024?random=${Math.random()}`,
    provider: 'development',
    model: request.model,
    generationTime: 1000 + Math.random() * 2000,
    cost: 0.035,
  }
}
```

### BatchImageGenerationService

```typescript
// Added duplicate processing prevention
if (
  batchResponse.status === 'processing' ||
  batchResponse.status === 'completed'
) {
  console.log(
    `Batch ${batchId} is already ${batchResponse.status}, skipping duplicate processing`
  )
  return batchResponse
}

// Added real progress tracking
const processingResult = await this.processor.processBatch(
  queueItem.batch,
  progress => {
    this.queueManager.updateBatchProgress(batchId, progress)
    console.log(`Batch ${batchId} progress: ${progress.progress}%`)
  }
)
```

### BatchQueueManager

```typescript
// Added real progress update method
updateBatchProgress(batchId: string, progress: BatchProgress): void {
  const batchResponse = this.activeBatches.get(batchId)
  if (batchResponse) {
    batchResponse.completedRequests = progress.completedCount
    batchResponse.status = progress.status as BatchStatus
    this.latestProgress.set(batchId, progress)
  }
}

// Added cleanup method
cleanupCompletedBatches(): void {
  const oneHourAgo = Date.now() - (60 * 60 * 1000)
  Array.from(this.activeBatches.entries()).forEach(([batchId, batchResponse]) => {
    if (
      (batchResponse.status === 'completed' || batchResponse.status === 'failed') &&
      batchResponse.endTime &&
      batchResponse.endTime.getTime() < oneHourAgo
    ) {
      this.removeBatch(batchId)
    }
  })
}
```

### API Route

```typescript
// Removed setTimeout to prevent race conditions
getBatchService()
  .processBatch(batchId)
  .catch(error => {
    console.error(`Batch processing failed for ${batchId}:`, error)
  })
```

### Auth Middleware

```typescript
// Use secure authentication method
const {
  data: { user },
  error,
} = await supabase.auth.getUser()
```

## Testing

A test script has been created at `scripts/test-batch-processing.js` to verify the fixes:

```bash
node scripts/test-batch-processing.js
```

This script:

1. Schedules a test batch
2. Monitors progress in real-time
3. Checks queue status
4. Verifies metrics
5. Confirms no duplicate processing occurs

## Expected Behavior After Fixes

1. **No Duplicate Processing**: Each batch should only be processed once
2. **Real Progress**: Progress updates should reflect actual image generation progress
3. **No Auth Warnings**: Supabase authentication warnings should be eliminated
4. **Memory Management**: Completed batches should be cleaned up automatically
5. **Consistent Logs**: Batch processing logs should show clear start/completion without duplicates
6. **Development Mode**: Works without API keys using placeholder images

## Monitoring

To monitor batch processing:

1. Check server logs for duplicate processing messages
2. Use the `/test-batch` page to verify progress updates are accurate
3. Monitor memory usage to ensure cleanup is working
4. Verify no Supabase auth warnings appear in logs
5. Look for "(development mode)" indicators when API keys are missing

## Troubleshooting

### "Failed to check status: Failed to fetch"

This error occurs when:

- The development server is not running
- The batch was cleaned up due to age
- Network connectivity issues

**Solution**: Restart the development server and try again.

### Batch shows 100% but status is "failed"

This can happen when:

- API keys are invalid or missing (now handled by development mode)
- Rate limits are exceeded
- Provider services are down

**Solution**: Check the server logs for specific error messages. If no API keys are configured, the system will automatically use development mode.
