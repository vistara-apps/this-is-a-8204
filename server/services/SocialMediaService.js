import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

class SocialMediaService {
  constructor() {
    this.instagramAccessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
    this.facebookAppId = process.env.FACEBOOK_APP_ID;
    this.facebookAppSecret = process.env.FACEBOOK_APP_SECRET;
    
    // Test account configurations (for demo purposes)
    this.testAccounts = {
      instagram: {
        username: 'adspark_test_ig',
        accountId: 'test_ig_account_123'
      },
      tiktok: {
        username: 'adspark_test_tt',
        accountId: 'test_tt_account_456'
      }
    };
  }

  /**
   * Post ad variations to social media platforms
   * @param {Array} adVariations - Array of ad variations to post
   * @param {Object} options - Posting options
   * @returns {Array} Results of posting attempts
   */
  async postAdVariations(adVariations, options = {}) {
    try {
      const { useTestAccounts = true } = options;
      const results = [];

      console.log(`📱 Posting ${adVariations.length} ad variations to social media...`);

      for (const ad of adVariations) {
        try {
          let result;
          
          if (ad.platform === 'instagram') {
            result = await this.postToInstagram(ad, { useTestAccounts });
          } else if (ad.platform === 'tiktok') {
            result = await this.postToTikTok(ad, { useTestAccounts });
          } else {
            throw new Error(`Unsupported platform: ${ad.platform}`);
          }

          results.push({
            adVariationId: ad.adVariationId,
            platform: ad.platform,
            success: true,
            postId: result.postId,
            postUrl: result.postUrl,
            message: 'Posted successfully'
          });

        } catch (error) {
          console.error(`❌ Failed to post ad ${ad.adVariationId} to ${ad.platform}:`, error.message);
          
          results.push({
            adVariationId: ad.adVariationId,
            platform: ad.platform,
            success: false,
            error: error.message,
            message: 'Failed to post'
          });
        }
      }

      const successCount = results.filter(r => r.success).length;
      console.log(`✅ Posted ${successCount}/${adVariations.length} ad variations successfully`);

      return results;

    } catch (error) {
      console.error('❌ Error posting ad variations:', error);
      throw new Error('Failed to post ad variations');
    }
  }

  /**
   * Post to Instagram using Facebook Graph API
   * @param {Object} adVariation - Ad variation to post
   * @param {Object} options - Posting options
   * @returns {Object} Post result
   */
  async postToInstagram(adVariation, options = {}) {
    try {
      const { useTestAccounts = true } = options;

      if (useTestAccounts || !this.instagramAccessToken) {
        // Simulate Instagram posting for development/testing
        return this.simulateInstagramPost(adVariation);
      }

      // Real Instagram posting would go here
      // This requires proper Instagram Business Account setup and permissions
      
      const caption = `${adVariation.headline}\n\n${adVariation.copy}\n\n#adspark #ai #marketing`;
      
      // Step 1: Create media object
      const mediaResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.testAccounts.instagram.accountId}/media`,
        {
          image_url: adVariation.imageUrl,
          caption: caption,
          access_token: this.instagramAccessToken
        }
      );

      const mediaId = mediaResponse.data.id;

      // Step 2: Publish the media
      const publishResponse = await axios.post(
        `https://graph.facebook.com/v18.0/${this.testAccounts.instagram.accountId}/media_publish`,
        {
          creation_id: mediaId,
          access_token: this.instagramAccessToken
        }
      );

      const postId = publishResponse.data.id;

      console.log(`📸 Posted to Instagram: ${postId}`);

      return {
        postId,
        postUrl: `https://www.instagram.com/p/${postId}/`,
        platform: 'instagram',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error posting to Instagram:', error);
      throw new Error(`Instagram posting failed: ${error.message}`);
    }
  }

  /**
   * Post to TikTok (simulated - TikTok API has limited access)
   * @param {Object} adVariation - Ad variation to post
   * @param {Object} options - Posting options
   * @returns {Object} Post result
   */
  async postToTikTok(adVariation, options = {}) {
    try {
      // TikTok API is not publicly available for content posting
      // This is a simulation of what the integration would look like
      
      console.log(`🎵 Simulating TikTok post for ad: ${adVariation.headline}`);
      
      return this.simulateTikTokPost(adVariation);

    } catch (error) {
      console.error('Error posting to TikTok:', error);
      throw new Error(`TikTok posting failed: ${error.message}`);
    }
  }

  /**
   * Simulate Instagram posting for development
   */
  simulateInstagramPost(adVariation) {
    const postId = `ig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`📸 [SIMULATED] Instagram post created: ${postId}`);
    console.log(`   Caption: ${adVariation.headline}`);
    console.log(`   Copy: ${adVariation.copy}`);
    
    return {
      postId,
      postUrl: `https://www.instagram.com/p/${postId}/`,
      platform: 'instagram',
      timestamp: new Date().toISOString(),
      simulated: true,
      testAccount: this.testAccounts.instagram.username
    };
  }

  /**
   * Simulate TikTok posting for development
   */
  simulateTikTokPost(adVariation) {
    const postId = `tt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    console.log(`🎵 [SIMULATED] TikTok post created: ${postId}`);
    console.log(`   Title: ${adVariation.headline}`);
    console.log(`   Description: ${adVariation.copy}`);
    
    return {
      postId,
      postUrl: `https://www.tiktok.com/@${this.testAccounts.tiktok.username}/video/${postId}`,
      platform: 'tiktok',
      timestamp: new Date().toISOString(),
      simulated: true,
      testAccount: this.testAccounts.tiktok.username
    };
  }

  /**
   * Get post performance metrics
   * @param {string} postId - Social media post ID
   * @param {string} platform - Platform (instagram, tiktok)
   * @returns {Object} Performance metrics
   */
  async getPostMetrics(postId, platform) {
    try {
      if (platform === 'instagram') {
        return await this.getInstagramMetrics(postId);
      } else if (platform === 'tiktok') {
        return await this.getTikTokMetrics(postId);
      } else {
        throw new Error(`Unsupported platform: ${platform}`);
      }

    } catch (error) {
      console.error(`Error getting metrics for ${platform} post ${postId}:`, error);
      return this.getSimulatedMetrics(platform);
    }
  }

  /**
   * Get Instagram post metrics
   */
  async getInstagramMetrics(postId) {
    try {
      if (!this.instagramAccessToken) {
        return this.getSimulatedMetrics('instagram');
      }

      // Real Instagram metrics API call would go here
      const response = await axios.get(
        `https://graph.facebook.com/v18.0/${postId}`,
        {
          params: {
            fields: 'like_count,comments_count,shares_count,impressions',
            access_token: this.instagramAccessToken
          }
        }
      );

      return {
        views: response.data.impressions || 0,
        likes: response.data.like_count || 0,
        comments: response.data.comments_count || 0,
        shares: response.data.shares_count || 0,
        platform: 'instagram',
        lastUpdated: new Date().toISOString()
      };

    } catch (error) {
      console.error('Error fetching Instagram metrics:', error);
      return this.getSimulatedMetrics('instagram');
    }
  }

  /**
   * Get TikTok post metrics (simulated)
   */
  async getTikTokMetrics(postId) {
    // TikTok metrics API is not publicly available
    return this.getSimulatedMetrics('tiktok');
  }

  /**
   * Generate simulated metrics for development/testing
   */
  getSimulatedMetrics(platform) {
    const baseMetrics = {
      instagram: {
        views: Math.floor(Math.random() * 20000) + 5000,
        likes: Math.floor(Math.random() * 1500) + 300,
        comments: Math.floor(Math.random() * 100) + 20,
        shares: Math.floor(Math.random() * 200) + 50
      },
      tiktok: {
        views: Math.floor(Math.random() * 50000) + 10000,
        likes: Math.floor(Math.random() * 3000) + 500,
        comments: Math.floor(Math.random() * 150) + 30,
        shares: Math.floor(Math.random() * 400) + 100
      }
    };

    const metrics = baseMetrics[platform] || baseMetrics.instagram;
    
    return {
      ...metrics,
      platform,
      lastUpdated: new Date().toISOString(),
      simulated: true
    };
  }

  /**
   * Schedule posts for later publishing
   * @param {Array} adVariations - Ad variations to schedule
   * @param {Date} scheduledTime - When to publish
   * @returns {Array} Scheduling results
   */
  async scheduleAdVariations(adVariations, scheduledTime) {
    try {
      console.log(`📅 Scheduling ${adVariations.length} ad variations for ${scheduledTime}`);
      
      const results = adVariations.map(ad => ({
        adVariationId: ad.adVariationId,
        platform: ad.platform,
        scheduledTime: scheduledTime.toISOString(),
        status: 'scheduled',
        scheduleId: `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      }));

      // In a real implementation, you would store these in a job queue
      // and process them at the scheduled time
      
      return results;

    } catch (error) {
      console.error('Error scheduling ad variations:', error);
      throw new Error('Failed to schedule ad variations');
    }
  }

  /**
   * Delete a post from social media
   * @param {string} postId - Post ID to delete
   * @param {string} platform - Platform (instagram, tiktok)
   * @returns {Object} Deletion result
   */
  async deletePost(postId, platform) {
    try {
      console.log(`🗑️ Deleting ${platform} post: ${postId}`);
      
      if (platform === 'instagram' && this.instagramAccessToken) {
        await axios.delete(
          `https://graph.facebook.com/v18.0/${postId}`,
          {
            params: {
              access_token: this.instagramAccessToken
            }
          }
        );
      }

      // For TikTok and simulated posts, just log the deletion
      console.log(`✅ Post ${postId} deleted from ${platform}`);
      
      return {
        postId,
        platform,
        deleted: true,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`Error deleting ${platform} post ${postId}:`, error);
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  /**
   * Get account information for connected social media accounts
   * @returns {Object} Account information
   */
  async getAccountInfo() {
    try {
      const accounts = {
        instagram: {
          connected: !!this.instagramAccessToken,
          username: this.testAccounts.instagram.username,
          accountId: this.testAccounts.instagram.accountId,
          platform: 'instagram'
        },
        tiktok: {
          connected: false, // TikTok API not available
          username: this.testAccounts.tiktok.username,
          accountId: this.testAccounts.tiktok.accountId,
          platform: 'tiktok',
          note: 'TikTok posting is simulated (API not publicly available)'
        }
      };

      return accounts;

    } catch (error) {
      console.error('Error getting account info:', error);
      throw new Error('Failed to get account information');
    }
  }
}

export default new SocialMediaService();
