import express from 'express';
import { AdBatch } from '../models/AdBatch.js';
import { AdVariation } from '../models/AdVariation.js';
import { User } from '../models/User.js';
import SocialMediaService from '../services/SocialMediaService.js';

const router = express.Router();

/**
 * GET /api/analytics/batch/:batchId
 * Get analytics for a specific ad batch
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

    const variations = await AdVariation.findByBatchId(batchId);
    const statistics = await batch.getStatistics();

    // Calculate performance metrics
    const performanceMetrics = variations.map(variation => {
      const metrics = variation.actualPerformanceMetrics || {};
      return {
        adVariationId: variation.adVariationId,
        headline: variation.headline,
        platform: variation.platform,
        predictedScore: variation.predictedPerformanceScore,
        actualMetrics: metrics,
        engagementRate: variation.getEngagementRate(),
        postStatus: variation.postStatus,
        postId: variation.postId
      };
    });

    // Calculate totals
    const totalMetrics = variations.reduce((acc, variation) => {
      const metrics = variation.actualPerformanceMetrics || {};
      return {
        views: acc.views + (metrics.views || 0),
        likes: acc.likes + (metrics.likes || 0),
        comments: acc.comments + (metrics.comments || 0),
        shares: acc.shares + (metrics.shares || 0)
      };
    }, { views: 0, likes: 0, comments: 0, shares: 0 });

    const avgEngagementRate = variations.length > 0
      ? variations.reduce((sum, v) => sum + v.getEngagementRate(), 0) / variations.length
      : 0;

    res.json({
      message: 'Batch analytics retrieved successfully',
      batchId,
      batch: batch.toJSON(),
      statistics,
      totalMetrics,
      avgEngagementRate: parseFloat(avgEngagementRate.toFixed(2)),
      variations: performanceMetrics
    });

  } catch (error) {
    console.error('Get batch analytics error:', error);
    res.status(500).json({
      error: 'Failed to get batch analytics',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/user/:userId
 * Get analytics overview for a user
 */
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = '30d' } = req.query;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    // Get user's ad batches
    const batches = await AdBatch.findByUserId(userId, 50, 0);
    
    // Filter by timeframe
    const timeframeDays = parseInt(timeframe.replace('d', ''));
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - timeframeDays);

    const filteredBatches = batches.filter(batch => 
      new Date(batch.createdAt) >= cutoffDate
    );

    // Get all variations for these batches
    const allVariations = [];
    for (const batch of filteredBatches) {
      const variations = await AdVariation.findByBatchId(batch.batchId);
      allVariations.push(...variations);
    }

    // Calculate user-level metrics
    const totalMetrics = allVariations.reduce((acc, variation) => {
      const metrics = variation.actualPerformanceMetrics || {};
      return {
        views: acc.views + (metrics.views || 0),
        likes: acc.likes + (metrics.likes || 0),
        comments: acc.comments + (metrics.comments || 0),
        shares: acc.shares + (metrics.shares || 0)
      };
    }, { views: 0, likes: 0, comments: 0, shares: 0 });

    const postedVariations = allVariations.filter(v => v.postStatus === 'posted');
    const avgEngagementRate = postedVariations.length > 0
      ? postedVariations.reduce((sum, v) => sum + v.getEngagementRate(), 0) / postedVariations.length
      : 0;

    // Platform breakdown
    const platformBreakdown = allVariations.reduce((acc, variation) => {
      const platform = variation.platform;
      if (!acc[platform]) {
        acc[platform] = {
          count: 0,
          posted: 0,
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalShares: 0
        };
      }
      
      acc[platform].count++;
      if (variation.postStatus === 'posted') {
        acc[platform].posted++;
      }
      
      const metrics = variation.actualPerformanceMetrics || {};
      acc[platform].totalViews += metrics.views || 0;
      acc[platform].totalLikes += metrics.likes || 0;
      acc[platform].totalComments += metrics.comments || 0;
      acc[platform].totalShares += metrics.shares || 0;
      
      return acc;
    }, {});

    // Top performing ads
    const topPerformingAds = postedVariations
      .sort((a, b) => b.getEngagementRate() - a.getEngagementRate())
      .slice(0, 5)
      .map(variation => ({
        adVariationId: variation.adVariationId,
        headline: variation.headline,
        platform: variation.platform,
        engagementRate: variation.getEngagementRate(),
        metrics: variation.actualPerformanceMetrics || {},
        batchId: variation.batchId
      }));

    res.json({
      message: 'User analytics retrieved successfully',
      userId,
      timeframe,
      summary: {
        totalBatches: filteredBatches.length,
        totalVariations: allVariations.length,
        postedVariations: postedVariations.length,
        totalMetrics,
        avgEngagementRate: parseFloat(avgEngagementRate.toFixed(2))
      },
      platformBreakdown,
      topPerformingAds
    });

  } catch (error) {
    console.error('Get user analytics error:', error);
    res.status(500).json({
      error: 'Failed to get user analytics',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/variation/:variationId
 * Get detailed analytics for a specific ad variation
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

    // Get fresh metrics if the ad is posted
    let currentMetrics = variation.actualPerformanceMetrics || {};
    if (variation.postStatus === 'posted' && variation.postId) {
      try {
        const freshMetrics = await SocialMediaService.getPostMetrics(
          variation.postId, 
          variation.platform
        );
        
        // Update the variation with fresh metrics
        await variation.updatePerformanceMetrics(freshMetrics);
        currentMetrics = freshMetrics;
      } catch (error) {
        console.warn(`Could not fetch fresh metrics for variation ${variationId}:`, error.message);
      }
    }

    const performanceSummary = variation.getPerformanceSummary();

    res.json({
      message: 'Variation analytics retrieved successfully',
      variation: variation.toJSON(),
      currentMetrics,
      performanceSummary,
      insights: {
        engagementRate: variation.getEngagementRate(),
        predictedVsActual: {
          predicted: variation.predictedPerformanceScore,
          actual: performanceSummary.engagementRate,
          accuracy: Math.abs(variation.predictedPerformanceScore - performanceSummary.engagementRate)
        }
      }
    });

  } catch (error) {
    console.error('Get variation analytics error:', error);
    res.status(500).json({
      error: 'Failed to get variation analytics',
      message: error.message
    });
  }
});

/**
 * POST /api/analytics/refresh-metrics
 * Refresh metrics for all posted ads in a batch
 */
router.post('/refresh-metrics', async (req, res) => {
  try {
    const { batchId } = req.body;

    if (!batchId) {
      return res.status(400).json({
        error: 'Batch ID is required'
      });
    }

    const batch = await AdBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        error: 'Ad batch not found'
      });
    }

    const variations = await AdVariation.findByBatchId(batchId);
    const postedVariations = variations.filter(v => 
      v.postStatus === 'posted' && v.postId
    );

    console.log(`🔄 Refreshing metrics for ${postedVariations.length} posted ads`);

    const refreshResults = [];
    for (const variation of postedVariations) {
      try {
        const freshMetrics = await SocialMediaService.getPostMetrics(
          variation.postId,
          variation.platform
        );

        await variation.updatePerformanceMetrics(freshMetrics);
        
        refreshResults.push({
          adVariationId: variation.adVariationId,
          success: true,
          metrics: freshMetrics
        });
      } catch (error) {
        console.error(`Failed to refresh metrics for ${variation.adVariationId}:`, error);
        refreshResults.push({
          adVariationId: variation.adVariationId,
          success: false,
          error: error.message
        });
      }
    }

    const successCount = refreshResults.filter(r => r.success).length;

    res.json({
      message: 'Metrics refresh completed',
      batchId,
      summary: {
        total: postedVariations.length,
        successful: successCount,
        failed: postedVariations.length - successCount
      },
      results: refreshResults
    });

  } catch (error) {
    console.error('Refresh metrics error:', error);
    res.status(500).json({
      error: 'Failed to refresh metrics',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/compare
 * Compare performance across multiple ad variations or batches
 */
router.get('/compare', async (req, res) => {
  try {
    const { variationIds, batchIds } = req.query;

    if (!variationIds && !batchIds) {
      return res.status(400).json({
        error: 'Either variation IDs or batch IDs must be provided'
      });
    }

    let variations = [];

    if (variationIds) {
      const ids = Array.isArray(variationIds) ? variationIds : [variationIds];
      for (const id of ids) {
        const variation = await AdVariation.findById(id);
        if (variation) variations.push(variation);
      }
    }

    if (batchIds) {
      const ids = Array.isArray(batchIds) ? batchIds : [batchIds];
      for (const id of ids) {
        const batchVariations = await AdVariation.findByBatchId(id);
        variations.push(...batchVariations);
      }
    }

    if (variations.length === 0) {
      return res.status(404).json({
        error: 'No variations found for comparison'
      });
    }

    // Create comparison data
    const comparisonData = variations.map(variation => {
      const metrics = variation.actualPerformanceMetrics || {};
      return {
        adVariationId: variation.adVariationId,
        batchId: variation.batchId,
        headline: variation.headline,
        platform: variation.platform,
        predictedScore: variation.predictedPerformanceScore,
        engagementRate: variation.getEngagementRate(),
        metrics: {
          views: metrics.views || 0,
          likes: metrics.likes || 0,
          comments: metrics.comments || 0,
          shares: metrics.shares || 0
        },
        postStatus: variation.postStatus
      };
    });

    // Calculate comparison insights
    const postedAds = comparisonData.filter(ad => ad.postStatus === 'posted');
    const bestPerforming = postedAds.length > 0 
      ? postedAds.reduce((best, current) => 
          current.engagementRate > best.engagementRate ? current : best
        )
      : null;

    const platformComparison = comparisonData.reduce((acc, ad) => {
      if (!acc[ad.platform]) {
        acc[ad.platform] = {
          count: 0,
          avgEngagement: 0,
          totalViews: 0
        };
      }
      acc[ad.platform].count++;
      acc[ad.platform].avgEngagement += ad.engagementRate;
      acc[ad.platform].totalViews += ad.metrics.views;
      return acc;
    }, {});

    // Calculate averages
    Object.keys(platformComparison).forEach(platform => {
      platformComparison[platform].avgEngagement /= platformComparison[platform].count;
      platformComparison[platform].avgEngagement = parseFloat(
        platformComparison[platform].avgEngagement.toFixed(2)
      );
    });

    res.json({
      message: 'Comparison data retrieved successfully',
      comparisonData,
      insights: {
        totalVariations: variations.length,
        postedVariations: postedAds.length,
        bestPerforming,
        platformComparison
      }
    });

  } catch (error) {
    console.error('Compare analytics error:', error);
    res.status(500).json({
      error: 'Failed to compare analytics',
      message: error.message
    });
  }
});

/**
 * GET /api/analytics/export/:batchId
 * Export analytics data for a batch (CSV format)
 */
router.get('/export/:batchId', async (req, res) => {
  try {
    const { batchId } = req.params;
    const { format = 'json' } = req.query;

    const batch = await AdBatch.findById(batchId);
    if (!batch) {
      return res.status(404).json({
        error: 'Ad batch not found'
      });
    }

    const variations = await AdVariation.findByBatchId(batchId);
    
    const exportData = variations.map(variation => {
      const metrics = variation.actualPerformanceMetrics || {};
      return {
        adVariationId: variation.adVariationId,
        headline: variation.headline,
        copy: variation.copy,
        platform: variation.platform,
        predictedScore: variation.predictedPerformanceScore,
        postStatus: variation.postStatus,
        postId: variation.postId,
        views: metrics.views || 0,
        likes: metrics.likes || 0,
        comments: metrics.comments || 0,
        shares: metrics.shares || 0,
        engagementRate: variation.getEngagementRate(),
        createdAt: variation.createdAt,
        updatedAt: variation.updatedAt
      };
    });

    if (format === 'csv') {
      // Convert to CSV format
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => 
            typeof row[header] === 'string' && row[header].includes(',') 
              ? `"${row[header]}"` 
              : row[header]
          ).join(',')
        )
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="adspark-analytics-${batchId}.csv"`);
      res.send(csvContent);
    } else {
      res.json({
        message: 'Analytics data exported successfully',
        batchId,
        exportedAt: new Date().toISOString(),
        data: exportData
      });
    }

  } catch (error) {
    console.error('Export analytics error:', error);
    res.status(500).json({
      error: 'Failed to export analytics',
      message: error.message
    });
  }
});

export default router;
