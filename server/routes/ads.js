import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { AdBatch } from '../models/AdBatch.js';
import { AdVariation } from '../models/AdVariation.js';
import { User } from '../models/User.js';
import AIService from '../services/AIService.js';
import PaymentService from '../services/PaymentService.js';

const router = express.Router();

// Configure multer for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * POST /api/ads/upload-image
 * Upload and process product image
 */
router.post('/upload-image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No image file provided'
      });
    }

    console.log(`📸 Processing uploaded image: ${req.file.originalname}`);

    // Process image with Sharp
    const processedImageBuffer = await sharp(req.file.buffer)
      .resize(1080, 1080, { 
        fit: 'cover',
        position: 'center'
      })
      .jpeg({ quality: 85 })
      .toBuffer();

    // Convert to base64 for demo (in production, upload to cloud storage)
    const base64Image = `data:image/jpeg;base64,${processedImageBuffer.toString('base64')}`;

    // Analyze image with AI (optional)
    const imageAnalysis = await AIService.analyzeImage(base64Image);

    res.json({
      message: 'Image uploaded and processed successfully',
      imageUrl: base64Image,
      imageAnalysis,
      metadata: {
        originalName: req.file.originalname,
        size: processedImageBuffer.length,
        dimensions: { width: 1080, height: 1080 },
        format: 'jpeg'
      }
    });

  } catch (error) {
    console.error('Image upload error:', error);
    res.status(500).json({
      error: 'Failed to process image',
      message: error.message
    });
  }
});

/**
 * POST /api/ads/generate
 * Generate ad variations using AI
 */
router.post('/generate', async (req, res) => {
  try {
    const {
      userId,
      imageUrl,
      productDescription = '',
      targetAudience = 'general',
      tone = 'engaging',
      platforms = ['instagram', 'tiktok'],
      variationsPerPlatform = 2
    } = req.body;

    if (!userId || !imageUrl) {
      return res.status(400).json({
        error: 'User ID and image URL are required'
      });
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    console.log(`🤖 Generating ads for user ${userId}`);

    // Create ad batch
    const adBatch = await AdBatch.create({
      userId,
      productImageURL: imageUrl
    });

    // Generate ad variations using AI
    const adVariations = await AIService.generateAdVariations(imageUrl, {
      platforms,
      variationsPerPlatform,
      productDescription,
      targetAudience,
      tone
    });

    // Add predicted metrics to each variation
    const variationsWithMetrics = await Promise.all(
      adVariations.map(async (variation) => {
        const predictedMetrics = await AIService.predictPerformanceMetrics(variation);
        return {
          ...variation,
          batchId: adBatch.batchId,
          actualPerformanceMetrics: predictedMetrics
        };
      })
    );

    // Save ad variations to database
    const savedVariations = await AdVariation.createMany(variationsWithMetrics);

    console.log(`✅ Generated ${savedVariations.length} ad variations`);

    res.json({
      message: 'Ad variations generated successfully',
      batch: adBatch.toJSON(),
      variations: savedVariations.map(v => v.toJSON()),
      pricing: PaymentService.calculatePricing(savedVariations.length)
    });

  } catch (error) {
    console.error('Ad generation error:', error);
    res.status(500).json({
      error: 'Failed to generate ad variations',
      message: error.message
    });
  }
});

/**
 * GET /api/ads/batch/:batchId
 * Get ad batch with variations
 */
router.get('/batch/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await AdBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        error: 'Ad batch not found'
      });
    }

    const variations = await batch.getAdVariations();
    const statistics = await batch.getStatistics();

    res.json({
      batch: batch.toJSON(),
      variations: variations.map(v => new AdVariation(v).toJSON()),
      statistics
    });

  } catch (error) {
    console.error('Get batch error:', error);
    res.status(500).json({
      error: 'Failed to get ad batch',
      message: error.message
    });
  }
});

/**
 * PUT /api/ads/batch/:batchId/select
 * Select ad variations for posting
 */
router.put('/batch/:batchId/select', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { selectedAdIds } = req.body;

    if (!Array.isArray(selectedAdIds)) {
      return res.status(400).json({
        error: 'selectedAdIds must be an array'
      });
    }

    const batch = await AdBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        error: 'Ad batch not found'
      });
    }

    await batch.update({ selectedAds: selectedAdIds });

    console.log(`📋 Selected ${selectedAdIds.length} ads for batch ${batchId}`);

    res.json({
      message: 'Ad selection updated successfully',
      batch: batch.toJSON(),
      selectedCount: selectedAdIds.length
    });

  } catch (error) {
    console.error('Select ads error:', error);
    res.status(500).json({
      error: 'Failed to select ads',
      message: error.message
    });
  }
});

/**
 * GET /api/ads/variation/:variationId
 * Get specific ad variation
 */
router.get('/variation/:variationId', async (req, res) => {
  try {
    const { variationId } = req.params;

    const variation = await AdVariation.findById(variationId);
    if (!variation) {
      return res.status(404).json({
        error: 'Ad variation not found'
      });
    }

    res.json({
      variation: variation.toJSON()
    });

  } catch (error) {
    console.error('Get variation error:', error);
    res.status(500).json({
      error: 'Failed to get ad variation',
      message: error.message
    });
  }
});

/**
 * PUT /api/ads/variation/:variationId
 * Update ad variation
 */
router.put('/variation/:variationId', async (req, res) => {
  try {
    const { variationId } = req.params;
    const updateData = req.body;

    const variation = await AdVariation.findById(variationId);
    if (!variation) {
      return res.status(404).json({
        error: 'Ad variation not found'
      });
    }

    await variation.update(updateData);

    console.log(`📝 Updated ad variation: ${variationId}`);

    res.json({
      message: 'Ad variation updated successfully',
      variation: variation.toJSON()
    });

  } catch (error) {
    console.error('Update variation error:', error);
    res.status(500).json({
      error: 'Failed to update ad variation',
      message: error.message
    });
  }
});

/**
 * DELETE /api/ads/variation/:variationId
 * Delete ad variation
 */
router.delete('/variation/:variationId', async (req, res) => {
  try {
    const { variationId } = req.params;

    const variation = await AdVariation.findById(variationId);
    if (!variation) {
      return res.status(404).json({
        error: 'Ad variation not found'
      });
    }

    await variation.delete();

    console.log(`🗑️ Deleted ad variation: ${variationId}`);

    res.json({
      message: 'Ad variation deleted successfully'
    });

  } catch (error) {
    console.error('Delete variation error:', error);
    res.status(500).json({
      error: 'Failed to delete ad variation',
      message: error.message
    });
  }
});

/**
 * POST /api/ads/regenerate
 * Regenerate specific ad variations
 */
router.post('/regenerate', async (req, res) => {
  try {
    const {
      batchId,
      variationIds,
      regenerationOptions = {}
    } = req.body;

    if (!batchId || !Array.isArray(variationIds)) {
      return res.status(400).json({
        error: 'Batch ID and variation IDs are required'
      });
    }

    const batch = await AdBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        error: 'Ad batch not found'
      });
    }

    console.log(`🔄 Regenerating ${variationIds.length} ad variations`);

    // Get existing variations to understand context
    const existingVariations = await AdVariation.findByBatchId(batchId);
    const variationsToRegenerate = existingVariations.filter(v => 
      variationIds.includes(v.adVariationId)
    );

    // Generate new variations
    const newVariations = [];
    for (const oldVariation of variationsToRegenerate) {
      const newAdVariations = await AIService.generateAdVariations(
        batch.productImageURL,
        {
          platforms: [oldVariation.platform],
          variationsPerPlatform: 1,
          ...regenerationOptions
        }
      );

      if (newAdVariations.length > 0) {
        const newVariation = newAdVariations[0];
        const predictedMetrics = await AIService.predictPerformanceMetrics(newVariation);
        
        // Update the existing variation
        await oldVariation.update({
          headline: newVariation.headline,
          copy: newVariation.copy,
          predictedPerformanceScore: newVariation.predictedPerformanceScore,
          actualPerformanceMetrics: predictedMetrics
        });

        newVariations.push(oldVariation);
      }
    }

    res.json({
      message: 'Ad variations regenerated successfully',
      regeneratedCount: newVariations.length,
      variations: newVariations.map(v => v.toJSON())
    });

  } catch (error) {
    console.error('Regenerate ads error:', error);
    res.status(500).json({
      error: 'Failed to regenerate ad variations',
      message: error.message
    });
  }
});

/**
 * GET /api/ads/user/:userId/batches
 * Get all ad batches for a user
 */
router.get('/user/:userId/batches', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const batches = await AdBatch.findByUserId(
      userId, 
      parseInt(limit), 
      parseInt(offset)
    );

    // Get statistics for each batch
    const batchesWithStats = await Promise.all(
      batches.map(async (batch) => {
        const stats = await batch.getStatistics();
        return {
          ...batch.toJSON(),
          statistics: stats
        };
      })
    );

    res.json({
      batches: batchesWithStats,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: batches.length
      }
    });

  } catch (error) {
    console.error('Get user batches error:', error);
    res.status(500).json({
      error: 'Failed to get user ad batches',
      message: error.message
    });
  }
});

export default router;
