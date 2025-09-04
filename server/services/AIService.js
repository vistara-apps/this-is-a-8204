import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

dotenv.config();

class AIService {
  constructor() {
    // Initialize OpenAI client
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    // Initialize Anthropic client
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
  }

  /**
   * Generate ad variations using AI
   * @param {string} imageUrl - URL of the product image
   * @param {Object} options - Generation options
   * @returns {Array} Array of ad variations
   */
  async generateAdVariations(imageUrl, options = {}) {
    try {
      const {
        platforms = ['instagram', 'tiktok'],
        variationsPerPlatform = 2,
        productDescription = '',
        targetAudience = 'general',
        tone = 'engaging'
      } = options;

      console.log('🤖 Generating ad variations with AI...');

      // Generate copy variations using Anthropic
      const copyVariations = await this.generateAdCopy({
        platforms,
        variationsPerPlatform,
        productDescription,
        targetAudience,
        tone
      });

      // Generate image variations using OpenAI (if available)
      const imageVariations = await this.generateImageVariations(imageUrl, copyVariations.length);

      // Combine copy and images into ad variations
      const adVariations = copyVariations.map((copy, index) => ({
        headline: copy.headline,
        copy: copy.copy,
        platform: copy.platform,
        imageUrl: imageVariations[index] || imageUrl, // Use original if no variations
        creativeType: 'image',
        predictedPerformanceScore: this.calculatePredictedScore(copy, copy.platform)
      }));

      console.log(`✅ Generated ${adVariations.length} ad variations`);
      return adVariations;

    } catch (error) {
      console.error('❌ Error generating ad variations:', error);
      throw new Error('Failed to generate ad variations');
    }
  }

  /**
   * Generate ad copy using Anthropic Claude
   */
  async generateAdCopy(options) {
    try {
      const { platforms, variationsPerPlatform, productDescription, targetAudience, tone } = options;
      
      const prompt = `Generate ${variationsPerPlatform * platforms.length} social media ad variations for the following:

Product Description: ${productDescription || 'A product shown in the uploaded image'}
Target Audience: ${targetAudience}
Tone: ${tone}
Platforms: ${platforms.join(', ')}

For each variation, provide:
1. A compelling headline (max 60 characters)
2. Engaging ad copy (max 125 characters for Instagram, max 100 for TikTok)
3. Platform optimization

Requirements:
- Headlines should be attention-grabbing and benefit-focused
- Copy should create urgency or curiosity
- Include emotional triggers and clear value propositions
- Optimize for each platform's audience and format
- Vary the messaging approach (urgency, social proof, benefits, etc.)

Return the response as a JSON array with this structure:
[
  {
    "headline": "Transform Your Style Today",
    "copy": "Discover the perfect look that matches your personality. Join thousands who've already transformed their style.",
    "platform": "instagram",
    "approach": "transformation"
  }
]`;

      let copyVariations = [];

      if (this.anthropic) {
        const response = await this.anthropic.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: prompt
          }]
        });

        try {
          const content = response.content[0].text;
          const jsonMatch = content.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            copyVariations = JSON.parse(jsonMatch[0]);
          }
        } catch (parseError) {
          console.warn('Failed to parse AI response, using fallback');
        }
      }

      // Fallback variations if AI is not available or fails
      if (copyVariations.length === 0) {
        copyVariations = this.getFallbackCopyVariations(platforms, variationsPerPlatform);
      }

      return copyVariations;

    } catch (error) {
      console.error('Error generating ad copy:', error);
      return this.getFallbackCopyVariations(options.platforms, options.variationsPerPlatform);
    }
  }

  /**
   * Generate image variations using OpenAI DALL-E
   */
  async generateImageVariations(originalImageUrl, count = 4) {
    try {
      if (!this.openai) {
        console.log('OpenAI not configured, using original image');
        return Array(count).fill(originalImageUrl);
      }

      // For now, return the original image as OpenAI image variations require more complex setup
      // In production, you would implement image-to-image variations here
      console.log('🖼️ Using original image (image variations require additional setup)');
      return Array(count).fill(originalImageUrl);

    } catch (error) {
      console.error('Error generating image variations:', error);
      return Array(count).fill(originalImageUrl);
    }
  }

  /**
   * Calculate predicted performance score based on copy analysis
   */
  calculatePredictedScore(copy, platform) {
    let score = 70; // Base score

    // Analyze headline
    const headline = copy.headline.toLowerCase();
    if (headline.includes('limited') || headline.includes('exclusive')) score += 5;
    if (headline.includes('free') || headline.includes('save')) score += 3;
    if (headline.includes('new') || headline.includes('discover')) score += 2;
    if (headline.includes('!')) score += 2;

    // Analyze copy content
    const copyText = copy.copy.toLowerCase();
    if (copyText.includes('join') || copyText.includes('thousands')) score += 4;
    if (copyText.includes('transform') || copyText.includes('change')) score += 3;
    if (copyText.includes('today') || copyText.includes('now')) score += 3;
    if (copyText.includes('don\'t miss') || copyText.includes('hurry')) score += 5;

    // Platform-specific adjustments
    if (platform === 'tiktok') {
      if (copyText.includes('trend') || copyText.includes('viral')) score += 5;
      if (copyText.length < 80) score += 3; // Shorter copy performs better on TikTok
    } else if (platform === 'instagram') {
      if (copyText.includes('style') || copyText.includes('look')) score += 3;
      if (copyText.includes('photo') || copyText.includes('share')) score += 2;
    }

    // Ensure score is within bounds
    return Math.min(Math.max(score, 60), 95);
  }

  /**
   * Predict performance metrics for an ad variation
   */
  async predictPerformanceMetrics(adVariation) {
    try {
      const baseMetrics = this.getBaseMetricsByPlatform(adVariation.platform);
      const scoreMultiplier = adVariation.predictedPerformanceScore / 100;

      const predictedMetrics = {
        views: Math.round(baseMetrics.views * scoreMultiplier * (0.8 + Math.random() * 0.4)),
        likes: Math.round(baseMetrics.likes * scoreMultiplier * (0.8 + Math.random() * 0.4)),
        comments: Math.round(baseMetrics.comments * scoreMultiplier * (0.8 + Math.random() * 0.4)),
        shares: Math.round(baseMetrics.shares * scoreMultiplier * (0.8 + Math.random() * 0.4))
      };

      return predictedMetrics;

    } catch (error) {
      console.error('Error predicting performance metrics:', error);
      return this.getBaseMetricsByPlatform(adVariation.platform);
    }
  }

  /**
   * Get base metrics by platform for predictions
   */
  getBaseMetricsByPlatform(platform) {
    const baseMetrics = {
      instagram: {
        views: 15000,
        likes: 1200,
        comments: 85,
        shares: 150
      },
      tiktok: {
        views: 25000,
        likes: 2000,
        comments: 120,
        shares: 300
      }
    };

    return baseMetrics[platform] || baseMetrics.instagram;
  }

  /**
   * Fallback ad copy variations when AI is not available
   */
  getFallbackCopyVariations(platforms, variationsPerPlatform) {
    const templates = [
      {
        headline: "Transform Your Style Today",
        copy: "Discover the perfect look that matches your personality. Join thousands who've already transformed their style.",
        approach: "transformation"
      },
      {
        headline: "Limited Time: 50% Off",
        copy: "Don't miss out! This exclusive offer ends soon. Get yours before it's too late.",
        approach: "urgency"
      },
      {
        headline: "Why Everyone's Talking About This",
        copy: "See what the buzz is all about. Join the conversation and discover something amazing.",
        approach: "social_proof"
      },
      {
        headline: "Your Next Favorite Thing",
        copy: "Ready to fall in love? This could be exactly what you've been searching for.",
        approach: "emotional"
      }
    ];

    const variations = [];
    let templateIndex = 0;

    for (const platform of platforms) {
      for (let i = 0; i < variationsPerPlatform; i++) {
        const template = templates[templateIndex % templates.length];
        variations.push({
          ...template,
          platform,
          copy: platform === 'tiktok' && template.copy.length > 100 
            ? template.copy.substring(0, 97) + '...'
            : template.copy
        });
        templateIndex++;
      }
    }

    return variations;
  }

  /**
   * Analyze image content for better ad generation
   */
  async analyzeImage(imageUrl) {
    try {
      if (!this.openai) {
        return { description: 'Product image', category: 'general' };
      }

      // This would use OpenAI's vision capabilities to analyze the image
      // For now, return a basic analysis
      return {
        description: 'Product image uploaded by user',
        category: 'general',
        suggestedTags: ['product', 'lifestyle', 'quality']
      };

    } catch (error) {
      console.error('Error analyzing image:', error);
      return { description: 'Product image', category: 'general' };
    }
  }
}

export default new AIService();
