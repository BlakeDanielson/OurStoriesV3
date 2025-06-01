# Story Batch Prompts for Testing

## "Luna's Magical Adventure" - Complete Story Arc

A curious 8-year-old girl with curly brown hair named Luna finds a glowing crystal in her grandmother's attic, warm golden light emanating from an ancient wooden chest, dust particles dancing in sunbeams, watercolor illustration style
Luna holding the magical crystal as her bedroom transforms around her, walls becoming enchanted forest trees, furniture turning into mushroom houses, soft magical sparkles filling the air, whimsical children's book illustration
Luna meeting a wise talking owl with silver feathers and kind amber eyes in the magical forest, the owl perched on a moss-covered branch, Luna looking up with wonder and excitement, friendly forest creatures watching from behind trees
Luna and the owl facing a dark thorny maze that blocks their path to the Crystal Castle, ominous shadows but Luna showing brave determination, the owl providing encouraging guidance, dramatic lighting with hope breaking through
Luna bravely walking through the thorny maze, the magical crystal in her hand creating a protective golden light that clears the dark thorns, showing her inner strength and courage, inspirational and uplifting scene
Luna and the owl arriving at a beautiful Crystal Castle made of rainbow-colored gems, floating in clouds with waterfalls cascading down, magical creatures celebrating their arrival, breathtaking fantasy landscape
Inside the castle, Luna meeting the Crystal Queen who teaches her that the real magic was her courage and kindness all along, warm golden light surrounding them, Luna understanding and smiling with newfound wisdom
Luna back in her grandmother's attic, the crystal now a simple but precious keepsake, Luna hugging her grandmother and sharing her adventure, cozy warm lighting, the magic living on in Luna's heart and memories

---

## Usage Instructions

**For UI Testing:**

1. Copy all prompts from "Prompt 1" through "Prompt 8" (just the descriptive text after the colons)
2. Paste into the batch test UI at http://localhost:3000/test-batch
3. Each line will become one image in the batch

**For API Testing:**

```bash
curl -X POST http://localhost:3000/api/images/batch-generate \
  -H "Content-Type: application/json" \
  -d '{
    "prompts": [
      "A curious 8-year-old girl with curly brown hair named Luna finds a glowing crystal in her grandmother'\''s attic, warm golden light emanating from an ancient wooden chest, dust particles dancing in sunbeams, watercolor illustration style",
      "Luna holding the magical crystal as her bedroom transforms around her, walls becoming enchanted forest trees, furniture turning into mushroom houses, soft magical sparkles filling the air, whimsical children'\''s book illustration",
      "Luna meeting a wise talking owl with silver feathers and kind amber eyes in the magical forest, the owl perched on a moss-covered branch, Luna looking up with wonder and excitement, friendly forest creatures watching from behind trees",
      "Luna and the owl facing a dark thorny maze that blocks their path to the Crystal Castle, ominous shadows but Luna showing brave determination, the owl providing encouraging guidance, dramatic lighting with hope breaking through",
      "Luna bravely walking through the thorny maze, the magical crystal in her hand creating a protective golden light that clears the dark thorns, showing her inner strength and courage, inspirational and uplifting scene",
      "Luna and the owl arriving at a beautiful Crystal Castle made of rainbow-colored gems, floating in clouds with waterfalls cascading down, magical creatures celebrating their arrival, breathtaking fantasy landscape",
      "Inside the castle, Luna meeting the Crystal Queen who teaches her that the real magic was her courage and kindness all along, warm golden light surrounding them, Luna understanding and smiling with newfound wisdom",
      "Luna back in her grandmother'\''s attic, the crystal now a simple but precious keepsake, Luna hugging her grandmother and sharing her adventure, cozy warm lighting, the magic living on in Luna'\''s heart and memories"
    ],
    "model": "flux1",
    "options": {
      "priority": "medium",
      "maxConcurrency": 3,
      "failureStrategy": "continue-on-error"
    }
  }'
```

## Expected Results

- **8 images** that tell a complete story
- **Processing time**: ~4-6 minutes total (30s per image with 3 concurrent)
- **Character consistency**: Luna should appear similar across all images
- **Story flow**: Clear narrative progression from discovery to return
- **Art style**: Consistent children's book illustration style

This batch is perfect for testing:

- ✅ Character consistency across multiple images
- ✅ Narrative coherence in batch processing
- ✅ Processing time for medium-sized batches
- ✅ Queue management with story sequences
- ✅ Cost calculation for complete story generation
