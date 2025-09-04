import express from 'express';
import SocialMediaService from '../services/SocialMediaService.js';
import { AdBatch } from '../models/AdBatch.js';
import { AdVariation } from '../models/AdVariation.js';

const router = express.Router();

/**
 * POST /api/social/post
 * Post ad variations to social media platforms
 */
router.post('/post', async (req, res) => {
  try {
    const {
      batchId,
      selectedAdIds,
      useTestAccounts = true,
      scheduleTime = null
    } = req.body;

    if (!batchId || !Array.isArray(selectedAdIds)) {
      return res.status(400).json({
        error: 'Batch ID and selected ad IDs are required'
      });
    }

    // Get the ad batch
    const batch = await AdBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        error: 'Ad batch not found'
      });
    }

    // Get the selected ad variations
    const allVariations = await AdVariation.findByBatchId(batchId);
    const selectedVariations = allVariations.filter(v => 
      selectedAdIds.includes(v.adVariationId)
    );

    if (selectedVariations.length === 0) {
      return res.status(400).json({
        error: 'No valid ad variations found for the selected IDs'
      });
    }

    console.log(`📱 Posting ${selectedVariations.length} ad variations to social media`);

    let results;
    
    if (scheduleTime) {
      // Schedule posts for later
      const scheduledTime = new Date(scheduleTime);
      results = await SocialMediaService.scheduleAdVariations(selectedVariations, scheduledTime);
      
      // Update batch status
      await batch.updatePostingStatus('scheduled', selectedAdIds);
      
    } else {
      // Post immediately
      results = await SocialMediaService.postAdVariations(selectedVariations, {
        useTestAccounts
      });

      // Update ad variations with post results
      for (const result of results) {
        const variation = selectedVariations.find(v => v.adVariationId === result.adVariationId);
        if (variation) {
          await variation.updatePostStatus(
            result.success ? 'posted' : 'failed',
            result.postId
          );
        }
      }

      // Update batch status
      const successCount = results.filter(r => r.success).length;
      const status = successCount > 0 ? 'posted' : 'failed';
      await batch.updatePostingStatus(status, selectedAdIds);
    }

    const successCount = results.filter(r => r.success || r.status === 'scheduled').length;

    res.json({
      message: scheduleTime ? 'Ad variations scheduled successfully' : 'Ad variations posted successfully',
      results,
      summary: {
        total: selectedVariations.length,
        successful: successCount,
        failed: selectedVariations.length - successCount,
        scheduled: !!scheduleTime
      }
    });

  } catch (error) {
    console.error('Post ads error:', error);
    res.status(500).json({
      error: 'Failed to post ad variations',
      message: error.message
    });
  }
});

/**
 * GET /api/social/metrics/:postId/:platform
 * Get performance metrics for a specific post
 */
router.get('/metrics/:postId/:platform', async (req, res) => {
  try {
    const { postId, platform } = req.params;

    if (!['instagram', 'tiktok'].includes(platform)) {
      return res.status(400).json({
        error: 'Platform must be either instagram or tiktok'
      });
    }

    console.log(`📊 Getting metrics for ${platform} post: ${postId}`);

    const metrics = await SocialMediaService.getPostMetrics(postId, platform);

    res.json({
      message: 'Metrics retrieved successfully',
      postId,
      platform,
      metrics
    });

  } catch (error) {
    console.error('Get metrics error:', error);
    res.status(500).json({
      error: 'Failed to get post metrics',
      message: error.message
    });
  }
});

/**
 * PUT /api/social/variation/:variationId/metrics
 * Update performance metrics for an ad variation
 */
router.put('/variation/:variationId/metrics', async (req, res) => {
  try {
    const { variationId } = req.params;
    const { metrics } = req.body;

    if (!metrics || typeof metrics !== 'object') {
      return res.status(400).json({
        error: 'Metrics object is required'
      });
    }

    const variation = await AdVariation.findById(variationId);
    if (!variation) {
      return res.status(404).json({
        error: 'Ad variation not found'
      });
    }

    await variation.updatePerformanceMetrics(metrics);

    console.log(`📊 Updated metrics for ad variation: ${variationId}`);

    res.json({
      message: 'Metrics updated successfully',
      variation: variation.toJSON()
    });

  } catch (error) {
    console.error('Update metrics error:', error);
    res.status(500).json({
      error: 'Failed to update metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/social/accounts
 * Get connected social media account information
 */
router.get('/accounts', async (req, res) => {
  try {
    const accountInfo = await SocialMediaService.getAccountInfo();

    res.json({
      message: 'Account information retrieved successfully',
      accounts: accountInfo
    });

  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({
      error: 'Failed to get account information',
      message: error.message
    });
  }
});

/**
 * DELETE /api/social/post/:postId/:platform
 * Delete a post from social media
 */
router.delete('/post/:postId/:platform', async (req, res) => {
  try {
    const { postId, platform } = req.params;

    if (!['instagram', 'tiktok'].includes(platform)) {
      return res.status(400).json({
        error: 'Platform must be either instagram or tiktok'
      });
    }

    console.log(`🗑️ Deleting ${platform} post: ${postId}`);

    const result = await SocialMediaService.deletePost(postId, platform);

    // Update the ad variation status
    const variations = await AdVariation.findByBatchId('*'); // This would need to be improved
    const variation = variations.find(v => v.postId === postId);
    if (variation) {
      await variation.updatePostStatus('deleted');
    }

    res.json({
      message: 'Post deleted successfully',
      result
    });

  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      error: 'Failed to delete post',
      message: error.message
    });
  }
});

/**
 * POST /api/social/schedule
 * Schedule ad variations for later posting
 */
router.post('/schedule', async (req, res) => {
  try {
    const {
      batchId,
      selectedAdIds,
      scheduledTime,
      useTestAccounts = true
    } = req.body;

    if (!batchId || !Array.isArray(selectedAdIds) || !scheduledTime) {
      return res.status(400).json({
        error: 'Batch ID, selected ad IDs, and scheduled time are required'
      });
    }

    const scheduledDate = new Date(scheduledTime);
    if (scheduledDate <= new Date()) {
      return res.status(400).json({
        error: 'Scheduled time must be in the future'
      });
    }

    // Get the ad batch
    const batch = await AdBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        error: 'Ad batch not found'
      });
    }

    // Get the selected ad variations
    const allVariations = await AdVariation.findByBatchId(batchId);
    const selectedVariations = allVariations.filter(v => 
      selectedAdIds.includes(v.adVariationId)
    );

    if (selectedVariations.length === 0) {
      return res.status(400).json({
        error: 'No valid ad variations found for the selected IDs'
      });
    }

    console.log(`📅 Scheduling ${selectedVariations.length} ad variations for ${scheduledDate}`);

    const results = await SocialMediaService.scheduleAdVariations(selectedVariations, scheduledDate);

    // Update ad variations status
    for (const result of results) {
      const variation = selectedVariations.find(v => v.adVariationId === result.adVariationId);
      if (variation) {
        await variation.updatePostStatus('scheduled');
      }
    }

    // Update batch status
    await batch.updatePostingStatus('scheduled', selectedAdIds);

    res.json({
      message: 'Ad variations scheduled successfully',
      scheduledTime: scheduledDate.toISOString(),
      results,
      summary: {
        total: selectedVariations.length,
        scheduled: results.length
      }
    });

  } catch (error) {
    console.error('Schedule ads error:', error);
    res.status(500).json({
      error: 'Failed to schedule ad variations',
      message: error.message
    });
  }
});

/**
 * GET /api/social/batch/:batchId/performance
 * Get performance summary for all posted ads in a batch
 */
router.get('/batch/:batchId/performance', async (req, res) => {
  try {
    const { batchId } = req.params;

    const batch = await AdBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        error: 'Ad batch not found'
      });
    }

    const variations = await AdVariation.findByBatchId(batchId);
    const postedVariations = variations.filter(v => v.postStatus === 'posted' && v.postId);

    console.log(`📊 Getting performance for ${postedVariations.length} posted ads`);

    // Get updated metrics for each posted variation
    const performanceData = await Promise.all(
      postedVariations.map(async (variation) => {
        try {
          const metrics = await SocialMediaService.getPostMetrics(variation.postId, variation.platform);
          
          // Update the variation with latest metrics
          await variation.updatePerformanceMetrics(metrics);
          
          return {
            adVariationId: variation.adVariationId,
            headline: variation.headline,
            platform: variation.platform,
            postId: variation.postId,
            metrics,
            engagementRate: variation.getEngagementRate(),
            predictedScore: variation.predictedPerformanceScore
          };
        } catch (error) {
          console.error(`Error getting metrics for variation ${variation.adVariationId}:`, error);
          return {
            adVariationId: variation.adVariationId,
            headline: variation.headline,
            platform: variation.platform,
            postId: variation.postId,
            metrics: variation.actualPerformanceMetrics || {},
            engagementRate: variation.getEngagementRate(),
            predictedScore: variation.predictedPerformanceScore,
            error: 'Failed to fetch latest metrics'
          };
        }
      })
    );

    // Calculate summary statistics
    const totalMetrics = performanceData.reduce((acc, data) => {
      const metrics = data.metrics || {};
      return {
        views: acc.views + (metrics.views || 0),
        likes: acc.likes + (metrics.likes || 0),
        comments: acc.comments + (metrics.comments || 0),
        shares: acc.shares + (metrics.shares || 0)
      };
    }, { views: 0, likes: 0, comments: 0, shares: 0 });

    const avgEngagementRate = performanceData.length > 0
      ? performanceData.reduce((sum, data) => sum + data.engagementRate, 0) / performanceData.length
      : 0;

    res.json({
      message: 'Performance data retrieved successfully',
      batchId,
      summary: {
        totalPosted: postedVariations.length,
        totalMetrics,
        avgEngagementRate: parseFloat(avgEngagementRate.toFixed(2)),
        platforms: [...new Set(performanceData.map(d => d.platform))]
      },
      variations: performanceData
    });

  } catch (error) {
    console.error('Get batch performance error:', error);
    res.status(500).json({
      error: 'Failed to get batch performance',
      message: error.message
    });
  }
});

export default router;
