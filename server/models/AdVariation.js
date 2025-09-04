import { supabaseAdmin } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class AdVariation {
  constructor(data) {
    this.adVariationId = data.adVariationId || uuidv4();
    this.batchId = data.batchId;
    this.creativeType = data.creativeType || 'image'; // image, video
    this.imageUrl = data.imageUrl;
    this.headline = data.headline;
    this.copy = data.copy;
    this.platform = data.platform; // instagram, tiktok
    this.predictedPerformanceScore = data.predictedPerformanceScore || 0;
    this.actualPerformanceMetrics = data.actualPerformanceMetrics || {};
    this.postId = data.postId || null; // Social media post ID after posting
    this.postStatus = data.postStatus || 'draft'; // draft, posted, failed
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Create a new ad variation
  static async create(variationData) {
    try {
      const variation = new AdVariation(variationData);
      
      const { data, error } = await supabaseAdmin
        .from('ad_variations')
        .insert([{
          ad_variation_id: variation.adVariationId,
          batch_id: variation.batchId,
          creative_type: variation.creativeType,
          image_url: variation.imageUrl,
          headline: variation.headline,
          copy: variation.copy,
          platform: variation.platform,
          predicted_performance_score: variation.predictedPerformanceScore,
          actual_performance_metrics: variation.actualPerformanceMetrics,
          post_id: variation.postId,
          post_status: variation.postStatus,
          created_at: variation.createdAt,
          updated_at: variation.updatedAt
        }])
        .select()
        .single();

      if (error) throw error;
      
      return new AdVariation({
        adVariationId: data.ad_variation_id,
        batchId: data.batch_id,
        creativeType: data.creative_type,
        imageUrl: data.image_url,
        headline: data.headline,
        copy: data.copy,
        platform: data.platform,
        predictedPerformanceScore: data.predicted_performance_score,
        actualPerformanceMetrics: data.actual_performance_metrics,
        postId: data.post_id,
        postStatus: data.post_status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      });
    } catch (error) {
      console.error('Error creating ad variation:', error);
      throw error;
    }
  }

  // Create multiple ad variations
  static async createMany(variationsData) {
    try {
      const variations = variationsData.map(data => new AdVariation(data));
      
      const insertData = variations.map(variation => ({
        ad_variation_id: variation.adVariationId,
        batch_id: variation.batchId,
        creative_type: variation.creativeType,
        image_url: variation.imageUrl,
        headline: variation.headline,
        copy: variation.copy,
        platform: variation.platform,
        predicted_performance_score: variation.predictedPerformanceScore,
        actual_performance_metrics: variation.actualPerformanceMetrics,
        post_id: variation.postId,
        post_status: variation.postStatus,
        created_at: variation.createdAt,
        updated_at: variation.updatedAt
      }));

      const { data, error } = await supabaseAdmin
        .from('ad_variations')
        .insert(insertData)
        .select();

      if (error) throw error;
      
      return data.map(item => new AdVariation({
        adVariationId: item.ad_variation_id,
        batchId: item.batch_id,
        creativeType: item.creative_type,
        imageUrl: item.image_url,
        headline: item.headline,
        copy: item.copy,
        platform: item.platform,
        predictedPerformanceScore: item.predicted_performance_score,
        actualPerformanceMetrics: item.actual_performance_metrics,
        postId: item.post_id,
        postStatus: item.post_status,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) {
      console.error('Error creating ad variations:', error);
      throw error;
    }
  }

  // Find variation by ID
  static async findById(adVariationId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('ad_variations')
        .select('*')
        .eq('ad_variation_id', adVariationId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return new AdVariation({
        adVariationId: data.ad_variation_id,
        batchId: data.batch_id,
        creativeType: data.creative_type,
        imageUrl: data.image_url,
        headline: data.headline,
        copy: data.copy,
        platform: data.platform,
        predictedPerformanceScore: data.predicted_performance_score,
        actualPerformanceMetrics: data.actual_performance_metrics,
        postId: data.post_id,
        postStatus: data.post_status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      });
    } catch (error) {
      console.error('Error finding ad variation by ID:', error);
      throw error;
    }
  }

  // Find variations by batch ID
  static async findByBatchId(batchId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('ad_variations')
        .select('*')
        .eq('batch_id', batchId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(item => new AdVariation({
        adVariationId: item.ad_variation_id,
        batchId: item.batch_id,
        creativeType: item.creative_type,
        imageUrl: item.image_url,
        headline: item.headline,
        copy: item.copy,
        platform: item.platform,
        predictedPerformanceScore: item.predicted_performance_score,
        actualPerformanceMetrics: item.actual_performance_metrics,
        postId: item.post_id,
        postStatus: item.post_status,
        createdAt: item.created_at,
        updatedAt: item.updated_at
      }));
    } catch (error) {
      console.error('Error finding ad variations by batch ID:', error);
      throw error;
    }
  }

  // Update variation
  async update(updateData) {
    try {
      const updatedFields = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Convert camelCase to snake_case for database
      const dbFields = {};
      if (updatedFields.creativeType !== undefined) dbFields.creative_type = updatedFields.creativeType;
      if (updatedFields.imageUrl !== undefined) dbFields.image_url = updatedFields.imageUrl;
      if (updatedFields.headline !== undefined) dbFields.headline = updatedFields.headline;
      if (updatedFields.copy !== undefined) dbFields.copy = updatedFields.copy;
      if (updatedFields.platform !== undefined) dbFields.platform = updatedFields.platform;
      if (updatedFields.predictedPerformanceScore !== undefined) dbFields.predicted_performance_score = updatedFields.predictedPerformanceScore;
      if (updatedFields.actualPerformanceMetrics !== undefined) dbFields.actual_performance_metrics = updatedFields.actualPerformanceMetrics;
      if (updatedFields.postId !== undefined) dbFields.post_id = updatedFields.postId;
      if (updatedFields.postStatus !== undefined) dbFields.post_status = updatedFields.postStatus;
      dbFields.updated_at = updatedFields.updated_at;

      const { data, error } = await supabaseAdmin
        .from('ad_variations')
        .update(dbFields)
        .eq('ad_variation_id', this.adVariationId)
        .select()
        .single();

      if (error) throw error;

      // Update current instance
      this.creativeType = data.creative_type;
      this.imageUrl = data.image_url;
      this.headline = data.headline;
      this.copy = data.copy;
      this.platform = data.platform;
      this.predictedPerformanceScore = data.predicted_performance_score;
      this.actualPerformanceMetrics = data.actual_performance_metrics;
      this.postId = data.post_id;
      this.postStatus = data.post_status;
      this.updatedAt = data.updated_at;

      return this;
    } catch (error) {
      console.error('Error updating ad variation:', error);
      throw error;
    }
  }

  // Delete variation
  async delete() {
    try {
      const { error } = await supabaseAdmin
        .from('ad_variations')
        .delete()
        .eq('ad_variation_id', this.adVariationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting ad variation:', error);
      throw error;
    }
  }

  // Update performance metrics
  async updatePerformanceMetrics(metrics) {
    try {
      const currentMetrics = this.actualPerformanceMetrics || {};
      const updatedMetrics = { ...currentMetrics, ...metrics };
      
      return await this.update({ 
        actualPerformanceMetrics: updatedMetrics 
      });
    } catch (error) {
      console.error('Error updating performance metrics:', error);
      throw error;
    }
  }

  // Update post status and ID
  async updatePostStatus(status, postId = null) {
    try {
      const updateData = { postStatus: status };
      if (postId) updateData.postId = postId;
      
      return await this.update(updateData);
    } catch (error) {
      console.error('Error updating post status:', error);
      throw error;
    }
  }

  // Calculate engagement rate
  getEngagementRate() {
    const metrics = this.actualPerformanceMetrics || {};
    const totalEngagement = (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
    const views = metrics.views || 0;
    
    return views > 0 ? (totalEngagement / views) * 100 : 0;
  }

  // Get performance summary
  getPerformanceSummary() {
    const metrics = this.actualPerformanceMetrics || {};
    return {
      views: metrics.views || 0,
      likes: metrics.likes || 0,
      comments: metrics.comments || 0,
      shares: metrics.shares || 0,
      engagementRate: this.getEngagementRate(),
      predictedScore: this.predictedPerformanceScore,
      platform: this.platform,
      postStatus: this.postStatus
    };
  }

  // Convert to JSON (for API responses)
  toJSON() {
    return {
      adVariationId: this.adVariationId,
      batchId: this.batchId,
      creativeType: this.creativeType,
      imageUrl: this.imageUrl,
      headline: this.headline,
      copy: this.copy,
      platform: this.platform,
      predictedPerformanceScore: this.predictedPerformanceScore,
      actualPerformanceMetrics: this.actualPerformanceMetrics,
      postId: this.postId,
      postStatus: this.postStatus,
      engagementRate: this.getEngagementRate(),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
