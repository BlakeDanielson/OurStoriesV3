# MiniMax Image-01 Timeout Fix

## Problem

The MiniMax Image-01 model was experiencing timeout errors after 30 seconds, which is insufficient for this more complex model that specializes in character reference support.

## Root Cause

The image generation service had a hardcoded 30-second timeout for all models, regardless of their complexity and expected generation time.

## Solution

Implemented model-specific timeout configurations with the following timeouts:

| Model                | Timeout  | Reason                                                      |
| -------------------- | -------- | ----------------------------------------------------------- |
| FLUX.1 Schnell       | 30s      | Fast model optimized for speed                              |
| FLUX Kontext Pro     | 60s      | Text-based editing requires more processing                 |
| Google Imagen 4      | 90s      | Premium model with high quality output                      |
| **MiniMax Image-01** | **120s** | **Character reference support requires complex processing** |
| FLUX 1.1 Pro Ultra   | 90s      | Ultra high-resolution generation                            |

## Changes Made

### 1. Image Generation Service (`lib/ai/image-generation.ts`)

- Added `MODEL_TIMEOUTS` configuration object
- Updated `pollReplicateStatus()` and `pollRunPodStatus()` methods to use model-specific timeouts
- Improved timeout error messages to include model and duration information
- Added logging to track polling progress

### 2. Frontend Updates (`app/test-replicate/page.tsx`)

- Updated model descriptions to show timeout information
- Added timeout property to model info interface

### 3. Test Script (`scripts/test-minimax-timeout.js`)

- Created test script to verify MiniMax timeout configuration
- Includes connection testing and timeout verification

## Testing

1. Run the test script: `node scripts/test-minimax-timeout.js`
2. Test in the web interface at `/test-replicate`
3. Select MiniMax Image-01 and generate an image
4. The model now has 120 seconds to complete instead of 30 seconds

## Benefits

- **Reduced timeout errors** for MiniMax Image-01
- **Better user experience** with appropriate wait times for each model
- **Improved error messages** that include model-specific information
- **Scalable solution** that can easily accommodate new models with different timeout requirements

## Monitoring

The service now logs polling progress, making it easier to:

- Track generation times for different models
- Identify if timeout adjustments are needed
- Debug generation issues

## Future Considerations

- Monitor actual generation times to optimize timeout values
- Consider implementing dynamic timeouts based on prompt complexity
- Add user-facing progress indicators for longer-running models
