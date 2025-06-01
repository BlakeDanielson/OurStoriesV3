# ourStories - AI-Powered Personalized Children's Books

> Create magical, one-of-a-kind storybooks where your child is the main character, featuring their unique appearance, personality traits, and hobbies woven into original narratives and illustrations.

## 🌟 Project Vision

To empower anyone to easily create magical, one-of-a-kind storybooks where a child's unique appearance, personality traits, hobbies, and even specific life moments are deeply woven into an original narrative and its illustrations, fostering a love for reading and making them feel truly seen, celebrated, and inspired.

## 🚀 Features

### Core Features (MVP)

- **Child Personalization**: Input child's name, personality traits, hobbies, and interests
- **Photo Upload**: Upload 1-5 photos for AI character likeness generation
- **Story Customization**: Choose illustration style, story length, theme, and story arc
- **AI-Powered Generation**:
  - Text generation using OpenAI GPT-4 or Google Gemini
  - Image generation using Stable Diffusion with LoRA training for character consistency
- **Interactive Preview**: Flipbook-style book preview with editing capabilities
- **Content Safety**: Comprehensive safety filters for age-appropriate content
- **E-commerce**: Complete checkout and payment processing with Stripe
- **Print-on-Demand**: Physical book production and shipping

### Advanced Features

- **Real-time Editing**: Inline text editing and image modification requests
- **Content Moderation**: AI-powered safety and bias detection
- **Analytics**: User behavior tracking and conversion metrics
- **Admin Dashboard**: Content management and system monitoring

## 🛠 Tech Stack

### Frontend

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand/Redux Toolkit
- **Forms**: React Hook Form + Zod validation

### Backend

- **Runtime**: Node.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **File Upload**: UploadThing
- **Job Queue**: BullMQ with Redis

### AI Services

- **Text Generation**: OpenAI GPT-4 / Google Gemini
- **Image Generation**: Stable Diffusion (Replicate/RunPod/Modal)
- **Content Safety**: OpenAI Moderation API, Google Cloud Vision
- **Image Processing**: Real-ESRGAN for upscaling

### Infrastructure

- **Hosting**: Vercel
- **Database**: Neon/Supabase PostgreSQL
- **Storage**: AWS S3 / Vercel Blob
- **Monitoring**: Sentry, Vercel Analytics
- **CI/CD**: GitHub Actions

## 📁 Project Structure

```
ourStories/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
│   ├── ui/                # shadcn/ui components
│   ├── forms/             # Form components
│   └── layout/            # Layout components
├── lib/                   # Utility functions and configurations
│   ├── ai/               # AI service integrations
│   ├── auth/             # Authentication utilities
│   ├── db/               # Database utilities
│   └── utils/            # General utilities
├── types/                 # TypeScript type definitions
├── hooks/                 # Custom React hooks
├── styles/               # Global styles and Tailwind config
├── public/               # Static assets
├── scripts/              # Build and deployment scripts
└── tasks/                # TaskMaster project management
```

## 🚦 Getting Started

### Prerequisites

- Node.js 18+
- npm/yarn/pnpm
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/ourStories.git
   cd ourStories
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your API keys and database URL
   ```

4. **Set up the database**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run the development server**

   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks
- `npm test` - Run tests
- `npm run test:e2e` - Run E2E tests

### Code Quality

- **ESLint**: Configured with Next.js and TypeScript rules
- **Prettier**: Code formatting
- **Husky**: Git hooks for pre-commit checks
- **lint-staged**: Run linters on staged files

## 📋 Task Management

This project uses [TaskMaster](https://github.com/taskmaster-ai/taskmaster) for project management:

- **View tasks**: `task-master list`
- **Next task**: `task-master next`
- **Task details**: `task-master show <id>`
- **Update status**: `task-master set-status --id=<id> --status=<status>`

See the `tasks/` directory for detailed task breakdowns.

## 🔐 Environment Variables

Required environment variables (see `.env.example`):

```bash
# Database
DATABASE_URL="postgresql://..."

# Authentication
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# AI Services
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."
REPLICATE_API_KEY="r8_..."

# File Upload
UPLOADTHING_SECRET="sk_live_..."
UPLOADTHING_APP_ID="your-app-id"

# Payment
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email
RESEND_API_KEY="re_..."
```

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### E2E Tests

```bash
npm run test:e2e
```

### Test Coverage

```bash
npm run test:coverage
```

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
npm run build
npm start
```

## 📊 Monitoring & Analytics

- **Error Tracking**: Sentry
- **Performance**: Vercel Analytics
- **User Analytics**: Google Analytics
- **Uptime**: Vercel monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Tailwind CSS](https://tailwindcss.com/) - CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [Prisma](https://prisma.io/) - Database ORM
- [OpenAI](https://openai.com/) - AI text generation
- [Replicate](https://replicate.com/) - AI image generation

## 📞 Support

For support, email support@ourstories.com or join our Discord community.

---

**Made with ❤️ for creating magical reading experiences for children**
