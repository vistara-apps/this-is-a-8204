import { supabaseAdmin } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class AdBatch {
  constructor(data) {
    this.batchId = data.batchId || uuidv4();
    this.userId = data.userId;
    this.productImageURL = data.productImageURL;
    this.generatedTime = data.generatedTime || new Date().toISOString();
    this.selectedAds = data.selectedAds || [];
    this.postingStatus = data.postingStatus || 'pending'; // pending, posted, failed
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Create a new ad batch
  static async create(batchData) {
    try {
      const batch = new AdBatch(batchData);
      
      const { data, error } = await supabaseAdmin
        .from('ad_batches')
        .insert([{
          batch_id: batch.batchId,
          user_id: batch.userId,
          product_image_url: batch.productImageURL,
          generated_time: batch.generatedTime,
          selected_ads: batch.selectedAds,
          posting_status: batch.postingStatus,
          created_at: batch.createdAt,
          updated_at: batch.updatedAt
        }])
        .select()
        .single();

      if (error) throw error;
      
      return new AdBatch({
        batchId: data.batch_id,
        userId: data.user_id,
        productImageURL: data.product_image_url,
        generatedTime: data.generated_time,
        selectedAds: data.selected_ads,
        postingStatus: data.posting_status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      });
    } catch (error) {
      console.error('Error creating ad batch:', error);
      throw error;
    }
  }

  // Find batch by ID
  static async findById(batchId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('ad_batches')
        .select('*')
        .eq('batch_id', batchId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return new AdBatch({
        batchId: data.batch_id,
        userId: data.user_id,
        productImageURL: data.product_image_url,
        generatedTime: data.generated_time,
        selectedAds: data.selected_ads,
        postingStatus: data.posting_status,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      });
    } catch (error) {
      console.error('Error finding ad batch by ID:', error);
      throw error;
    }
  }

  // Find batches by user ID
  static async findByUserId(userId, limit = 10, offset = 0) {
    try {
      const { data, error } = await supabaseAdmin
        .from('ad_batches')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return data.map(batch => new AdBatch({
        batchId: batch.batch_id,
        userId: batch.user_id,
        productImageURL: batch.product_image_url,
        generatedTime: batch.generated_time,
        selectedAds: batch.selected_ads,
        postingStatus: batch.posting_status,
        createdAt: batch.created_at,
        updatedAt: batch.updated_at
      }));
    } catch (error) {
      console.error('Error finding ad batches by user ID:', error);
      throw error;
    }
  }

  // Update batch
  async update(updateData) {
    try {
      const updatedFields = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Convert camelCase to snake_case for database
      const dbFields = {};
      if (updatedFields.productImageURL !== undefined) dbFields.product_image_url = updatedFields.productImageURL;
      if (updatedFields.selectedAds !== undefined) dbFields.selected_ads = updatedFields.selectedAds;
      if (updatedFields.postingStatus !== undefined) dbFields.posting_status = updatedFields.postingStatus;
      dbFields.updated_at = updatedFields.updated_at;

      const { data, error } = await supabaseAdmin
        .from('ad_batches')
        .update(dbFields)
        .eq('batch_id', this.batchId)
        .select()
        .single();

      if (error) throw error;

      // Update current instance
      this.productImageURL = data.product_image_url;
      this.selectedAds = data.selected_ads;
      this.postingStatus = data.posting_status;
      this.updatedAt = data.updated_at;

      return this;
    } catch (error) {
      console.error('Error updating ad batch:', error);
      throw error;
    }
  }

  // Delete batch
  async delete() {
    try {
      // First delete all associated ad variations
      const { error: variationsError } = await supabaseAdmin
        .from('ad_variations')
        .delete()
        .eq('batch_id', this.batchId);

      if (variationsError) throw variationsError;

      // Then delete the batch
      const { error } = await supabaseAdmin
        .from('ad_batches')
        .delete()
        .eq('batch_id', this.batchId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting ad batch:', error);
      throw error;
    }
  }

  // Get ad variations for this batch
  async getAdVariations() {
    try {
      const { data, error } = await supabaseAdmin
        .from('ad_variations')
        .select('*')
        .eq('batch_id', this.batchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting ad variations:', error);
      throw error;
    }
  }

  // Update posting status
  async updatePostingStatus(status, selectedAdIds = null) {
    try {
      const updateData = { postingStatus: status };
      if (selectedAdIds) {
        updateData.selectedAds = selectedAdIds;
      }
      
      return await this.update(updateData);
    } catch (error) {
      console.error('Error updating posting status:', error);
      throw error;
    }
  }

  // Get batch statistics
  async getStatistics() {
    try {
      const variations = await this.getAdVariations();
      
      const stats = {
        totalVariations: variations.length,
        selectedVariations: this.selectedAds.length,
        platforms: [...new Set(variations.map(v => v.platform))],
        avgPredictedScore: variations.length > 0 
          ? variations.reduce((sum, v) => sum + (v.predicted_performance_score || 0), 0) / variations.length 
          : 0,
        totalPredictedViews: variations.reduce((sum, v) => sum + (v.actual_performance_metrics?.views || 0), 0),
        totalPredictedEngagement: variations.reduce((sum, v) => {
          const metrics = v.actual_performance_metrics || {};
          return sum + (metrics.likes || 0) + (metrics.comments || 0) + (metrics.shares || 0);
        }, 0)
      };

      return stats;
    } catch (error) {
      console.error('Error getting batch statistics:', error);
      throw error;
    }
  }

  // Convert to JSON (for API responses)
  toJSON() {
    return {
      batchId: this.batchId,
      userId: this.userId,
      productImageURL: this.productImageURL,
      generatedTime: this.generatedTime,
      selectedAds: this.selectedAds,
      postingStatus: this.postingStatus,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
