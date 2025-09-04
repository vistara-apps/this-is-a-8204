-- AdSpark AI Database Schema
-- This file contains the SQL schema for creating the required tables in Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    payment_info JSONB DEFAULT '{}',
    linked_social_accounts JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad batches table
CREATE TABLE IF NOT EXISTS ad_batches (
    batch_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_image_url TEXT NOT NULL,
    generated_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    selected_ads TEXT[] DEFAULT '{}',
    posting_status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ad variations table
CREATE TABLE IF NOT EXISTS ad_variations (
    ad_variation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES ad_batches(batch_id) ON DELETE CASCADE,
    creative_type VARCHAR(50) DEFAULT 'image',
    image_url TEXT NOT NULL,
    headline VARCHAR(255) NOT NULL,
    copy TEXT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    predicted_performance_score INTEGER DEFAULT 0,
    actual_performance_metrics JSONB DEFAULT '{}',
    post_id VARCHAR(255),
    post_status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_ad_batches_user_id ON ad_batches(user_id);
CREATE INDEX IF NOT EXISTS idx_ad_batches_created_at ON ad_batches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_variations_batch_id ON ad_variations(batch_id);
CREATE INDEX IF NOT EXISTS idx_ad_variations_platform ON ad_variations(platform);
CREATE INDEX IF NOT EXISTS idx_ad_variations_post_status ON ad_variations(post_status);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_variations ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can only access their own ad batches
CREATE POLICY "Users can view own ad batches" ON ad_batches
    FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can create ad batches" ON ad_batches
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update own ad batches" ON ad_batches
    FOR UPDATE USING (auth.uid()::text = user_id::text);

-- Users can only access ad variations from their own batches
CREATE POLICY "Users can view own ad variations" ON ad_variations
    FOR SELECT USING (
        batch_id IN (
            SELECT batch_id FROM ad_batches 
            WHERE user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can create ad variations" ON ad_variations
    FOR INSERT WITH CHECK (
        batch_id IN (
            SELECT batch_id FROM ad_batches 
            WHERE user_id::text = auth.uid()::text
        )
    );

CREATE POLICY "Users can update own ad variations" ON ad_variations
    FOR UPDATE USING (
        batch_id IN (
            SELECT batch_id FROM ad_batches 
            WHERE user_id::text = auth.uid()::text
        )
    );

-- Functions for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_batches_updated_at 
    BEFORE UPDATE ON ad_batches 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_variations_updated_at 
    BEFORE UPDATE ON ad_variations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Sample data for development (optional)
-- Uncomment the following lines to insert sample data

/*
-- Insert sample user
INSERT INTO users (user_id, email, payment_info, linked_social_accounts) 
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'demo@adspark.ai',
    '{"lastPayment": {"amount": 50, "currency": "usd", "date": "2024-01-15T10:30:00Z"}}',
    '{"instagram": {"username": "adspark_demo", "linkedAt": "2024-01-10T09:00:00Z"}}'
) ON CONFLICT (email) DO NOTHING;

-- Insert sample ad batch
INSERT INTO ad_batches (batch_id, user_id, product_image_url, selected_ads, posting_status)
VALUES (
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    ARRAY['c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'],
    'posted'
) ON CONFLICT (batch_id) DO NOTHING;

-- Insert sample ad variations
INSERT INTO ad_variations (ad_variation_id, batch_id, image_url, headline, copy, platform, predicted_performance_score, actual_performance_metrics, post_status)
VALUES 
(
    'c1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    'Transform Your Style Today',
    'Discover the perfect look that matches your personality. Join thousands who''ve already transformed their style.',
    'instagram',
    87,
    '{"views": 12400, "likes": 1240, "comments": 89, "shares": 156}',
    'posted'
),
(
    'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
    'Limited Time: 50% Off',
    'Don''t miss out! This exclusive offer ends soon. Get yours before it''s too late.',
    'tiktok',
    92,
    '{"views": 18700, "likes": 2180, "comments": 134, "shares": 298}',
    'posted'
) ON CONFLICT (ad_variation_id) DO NOTHING;
*/

-- Grant necessary permissions (adjust based on your Supabase setup)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
