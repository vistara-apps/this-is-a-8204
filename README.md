# AdSpark AI - Complete PRD Implementation

AdSpark AI is an AI-powered web application that helps solo founders effortlessly create and test winning social media ads. Upload a single product image and generate multiple ad variations optimized for Instagram and TikTok, complete with performance predictions and automated posting capabilities.

## 🚀 Features

### Core Features
- **AI Ad Creative Generation**: Upload one product image and generate 3-5 distinct ad variations with different headlines, copy, and treatments
- **Performance Prediction**: AI predicts likely performance of each ad variation based on historical data and best practices
- **Automated Social Posting**: Auto-post selected ad variations to dedicated test Instagram or TikTok profiles
- **Basic Growth Analytics**: Track engagement metrics (likes, comments, views, follower growth) directly within the app

### Technical Features
- **Complete Backend API**: Express.js server with comprehensive REST endpoints
- **Database Integration**: Supabase with Row Level Security (RLS) policies
- **AI Services**: OpenAI and Anthropic integration for content generation
- **Payment Processing**: Stripe integration for micro-transactions ($0.50 per batch)
- **Social Media APIs**: Instagram Graph API integration (TikTok simulated)
- **Image Processing**: Sharp.js for image optimization and resizing
- **Real-time Analytics**: Performance tracking and metrics updates

## 🏗️ Architecture

### Backend Structure
```
server/
├── config/
│   └── database.js          # Supabase configuration
├── models/
│   ├── User.js              # User data model
│   ├── AdBatch.js           # Ad batch model
│   └── AdVariation.js       # Ad variation model
├── services/
│   ├── AIService.js         # AI integration (OpenAI/Anthropic)
│   ├── PaymentService.js    # Stripe payment processing
│   └── SocialMediaService.js # Social media posting
├── routes/
│   ├── auth.js              # Authentication endpoints
│   ├── ads.js               # Ad generation and management
│   ├── payments.js          # Payment processing
│   ├── social.js            # Social media operations
│   └── analytics.js         # Analytics and reporting
├── database/
│   └── schema.sql           # Database schema
└── index.js                 # Server entry point
```

### Frontend Structure
```
src/
├── components/
│   ├── ImageUploader.jsx    # Product image upload
│   ├── AdGenerator.jsx      # AI ad generation interface
│   ├── AdPreviewGrid.jsx    # Generated ads display
│   ├── Analytics.jsx        # Performance analytics
│   └── BillingModal.jsx     # Payment processing
├── hooks/
│   └── useApi.js            # API integration hook
├── utils/
│   └── api.js               # API client
└── App.jsx                  # Main application
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Stripe account (for payments)
- OpenAI API key (optional, for AI features)
- Anthropic API key (optional, for AI features)
- Instagram Business Account (optional, for real posting)

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd server
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Configure your `.env` file:
   ```env
   # Database
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # AI Services (optional)
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   
   # Payments
   STRIPE_SECRET_KEY=your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=your_webhook_secret
   
   # Social Media (optional)
   INSTAGRAM_ACCESS_TOKEN=your_instagram_token
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   
   # Server
   PORT=3001
   NODE_ENV=development
   ```

3. **Database Setup**
   - Create a new Supabase project
   - Run the SQL schema from `server/database/schema.sql` in your Supabase SQL editor
   - This creates all necessary tables, indexes, and RLS policies

4. **Start the Server**
   ```bash
   npm run dev
   ```
   
   The server will start on `http://localhost:3001`

### Frontend Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_URL=http://localhost:3001
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start the Development Server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5173`

## 📊 Database Schema

### Users Table
- `user_id` (UUID, Primary Key)
- `email` (VARCHAR, Unique)
- `payment_info` (JSONB)
- `linked_social_accounts` (JSONB)
- `created_at`, `updated_at` (Timestamps)

### Ad Batches Table
- `batch_id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `product_image_url` (TEXT)
- `selected_ads` (TEXT[])
- `posting_status` (VARCHAR)
- `created_at`, `updated_at` (Timestamps)

### Ad Variations Table
- `ad_variation_id` (UUID, Primary Key)
- `batch_id` (UUID, Foreign Key)
- `creative_type` (VARCHAR)
- `image_url` (TEXT)
- `headline` (VARCHAR)
- `copy` (TEXT)
- `platform` (VARCHAR)
- `predicted_performance_score` (INTEGER)
- `actual_performance_metrics` (JSONB)
- `post_id` (VARCHAR)
- `post_status` (VARCHAR)
- `created_at`, `updated_at` (Timestamps)

## 🔌 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - User login
- `GET /user/:userId` - Get user profile
- `PUT /user/:userId` - Update user profile
- `POST /user/:userId/social-accounts` - Link social accounts

### Ad Management (`/api/ads`)
- `POST /upload-image` - Upload and process product image
- `POST /generate` - Generate AI ad variations
- `GET /batch/:batchId` - Get ad batch with variations
- `PUT /batch/:batchId/select` - Select ads for posting
- `GET /variation/:variationId` - Get specific ad variation
- `PUT /variation/:variationId` - Update ad variation
- `POST /regenerate` - Regenerate specific variations

### Payments (`/api/payments`)
- `POST /create-intent` - Create payment intent
- `POST /confirm` - Confirm payment
- `POST /webhook` - Handle Stripe webhooks
- `GET /user/:userId/history` - Get payment history
- `GET /pricing` - Get pricing information

### Social Media (`/api/social`)
- `POST /post` - Post ads to social media
- `GET /metrics/:postId/:platform` - Get post metrics
- `PUT /variation/:variationId/metrics` - Update metrics
- `GET /accounts` - Get connected accounts
- `POST /schedule` - Schedule posts

### Analytics (`/api/analytics`)
- `GET /batch/:batchId` - Get batch analytics
- `GET /user/:userId` - Get user analytics overview
- `GET /variation/:variationId` - Get variation analytics
- `POST /refresh-metrics` - Refresh all metrics
- `GET /compare` - Compare performance
- `GET /export/:batchId` - Export analytics data

## 💳 Business Model

**Micro-transactions**: Pay-per-ad-generation batch
- **Base Price**: $0.50 for up to 4 ad variations + auto-post
- **Additional Variations**: $0.12 per variation beyond 4
- **Payment Processing**: Stripe with webhook support
- **Refund Support**: Full refund capability

## 🤖 AI Integration

### OpenAI Integration
- **Image Analysis**: Analyze uploaded product images
- **Image Variations**: Generate visual variations (planned)
- **Content Enhancement**: Improve ad copy quality

### Anthropic Claude Integration
- **Ad Copy Generation**: Create compelling headlines and copy
- **Platform Optimization**: Tailor content for Instagram/TikTok
- **Performance Prediction**: Analyze content for engagement potential

### Fallback System
- **Graceful Degradation**: Works without AI APIs
- **Template-based Generation**: Fallback ad templates
- **Simulated Predictions**: Basic performance scoring

## 📱 Social Media Integration

### Instagram (Facebook Graph API)
- **Business Account Required**: Instagram Business Account setup
- **Content Publishing**: Automated image + caption posting
- **Metrics Tracking**: Views, likes, comments, shares
- **Real-time Updates**: Performance data sync

### TikTok
- **Simulated Integration**: TikTok API not publicly available
- **Mock Posting**: Simulated posting for development
- **Metrics Simulation**: Realistic performance data

## 📈 Analytics & Reporting

### Performance Metrics
- **Engagement Rate**: Calculated from likes, comments, shares
- **Platform Comparison**: Instagram vs TikTok performance
- **Prediction Accuracy**: AI prediction vs actual performance
- **ROI Tracking**: Cost per engagement analysis

### Export Capabilities
- **CSV Export**: Download analytics data
- **JSON API**: Programmatic data access
- **Real-time Updates**: Live metrics refresh
- **Historical Data**: Performance trends over time

## 🔒 Security Features

### Row Level Security (RLS)
- **User Isolation**: Users can only access their own data
- **Automatic Policies**: Database-level security enforcement
- **API Authentication**: Token-based access control

### Data Protection
- **Environment Variables**: Secure API key storage
- **Input Validation**: Comprehensive request validation
- **Rate Limiting**: API abuse prevention
- **CORS Configuration**: Cross-origin request security

## 🚀 Deployment

### Production Checklist
- [ ] Configure production environment variables
- [ ] Set up Supabase production database
- [ ] Configure Stripe webhook endpoints
- [ ] Set up Instagram Business Account
- [ ] Configure domain and SSL
- [ ] Set up monitoring and logging
- [ ] Test payment flows
- [ ] Verify social media posting

### Environment Variables for Production
```env
NODE_ENV=production
SUPABASE_URL=your_production_supabase_url
STRIPE_SECRET_KEY=your_production_stripe_key
# ... other production keys
```

## 🧪 Testing

### Development Testing
- **AI Services**: Fallback templates when APIs unavailable
- **Payment Simulation**: Test payment flows without charges
- **Social Media**: Simulated posting for development
- **Database**: Sample data for testing

### API Testing
```bash
# Health check
curl http://localhost:3001/health

# Test image upload
curl -X POST -F "image=@test-image.jpg" http://localhost:3001/api/ads/upload-image

# Test ad generation
curl -X POST -H "Content-Type: application/json" \
  -d '{"userId":"test-user","imageUrl":"data:image/jpeg;base64,..."}' \
  http://localhost:3001/api/ads/generate
```

## 📝 Development Notes

### Key Implementation Details
- **Image Processing**: Sharp.js for optimization and resizing
- **Base64 Storage**: Images stored as base64 for demo (use cloud storage in production)
- **Micro-transaction Model**: Optimized for low-friction payments
- **Responsive Design**: Mobile-first approach
- **Error Handling**: Comprehensive error management
- **Logging**: Structured logging for debugging

### Future Enhancements
- **Video Ad Support**: TikTok video generation
- **A/B Testing**: Built-in split testing
- **Advanced Analytics**: Machine learning insights
- **Multi-language Support**: International markets
- **Team Collaboration**: Multi-user accounts
- **API Rate Limiting**: Advanced usage controls

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the API documentation
- Review the setup instructions

---

**AdSpark AI** - Effortlessly create and test winning social media ads with AI-powered automation.
