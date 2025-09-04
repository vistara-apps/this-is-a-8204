import { supabaseAdmin } from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

export class User {
  constructor(data) {
    this.userId = data.userId || uuidv4();
    this.email = data.email;
    this.paymentInfo = data.paymentInfo || null;
    this.linkedSocialAccounts = data.linkedSocialAccounts || {};
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  // Create a new user
  static async create(userData) {
    try {
      const user = new User(userData);
      
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert([{
          user_id: user.userId,
          email: user.email,
          payment_info: user.paymentInfo,
          linked_social_accounts: user.linkedSocialAccounts,
          created_at: user.createdAt,
          updated_at: user.updatedAt
        }])
        .select()
        .single();

      if (error) throw error;
      
      return new User({
        userId: data.user_id,
        email: data.email,
        paymentInfo: data.payment_info,
        linkedSocialAccounts: data.linked_social_accounts,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      });
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  // Find user by ID
  static async findById(userId) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return new User({
        userId: data.user_id,
        email: data.email,
        paymentInfo: data.payment_info,
        linkedSocialAccounts: data.linked_social_accounts,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      });
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return new User({
        userId: data.user_id,
        email: data.email,
        paymentInfo: data.payment_info,
        linkedSocialAccounts: data.linked_social_accounts,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      });
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  // Update user
  async update(updateData) {
    try {
      const updatedFields = {
        ...updateData,
        updated_at: new Date().toISOString()
      };

      // Convert camelCase to snake_case for database
      const dbFields = {};
      if (updatedFields.paymentInfo !== undefined) dbFields.payment_info = updatedFields.paymentInfo;
      if (updatedFields.linkedSocialAccounts !== undefined) dbFields.linked_social_accounts = updatedFields.linkedSocialAccounts;
      if (updatedFields.email !== undefined) dbFields.email = updatedFields.email;
      dbFields.updated_at = updatedFields.updated_at;

      const { data, error } = await supabaseAdmin
        .from('users')
        .update(dbFields)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) throw error;

      // Update current instance
      this.email = data.email;
      this.paymentInfo = data.payment_info;
      this.linkedSocialAccounts = data.linked_social_accounts;
      this.updatedAt = data.updated_at;

      return this;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Delete user
  async delete() {
    try {
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('user_id', this.userId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  // Get user's ad batches
  async getAdBatches(limit = 10, offset = 0) {
    try {
      const { data, error } = await supabaseAdmin
        .from('ad_batches')
        .select('*')
        .eq('user_id', this.userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user ad batches:', error);
      throw error;
    }
  }

  // Convert to JSON (for API responses)
  toJSON() {
    return {
      userId: this.userId,
      email: this.email,
      paymentInfo: this.paymentInfo,
      linkedSocialAccounts: this.linkedSocialAccounts,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
