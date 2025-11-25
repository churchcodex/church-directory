# Church Directory Management System

A modern, full-stack church directory application built with Next.js 15, TypeScript, MongoDB, and Cloudinary for managing churches, clergy members, and related data.

## Features

- **Church Management**: View, add, edit, and manage church information including location, members, and financials
- **Clergy Directory**: Track clergy members with detailed profiles including position, type, and marital status
- **Image Upload**: Cloudinary integration for secure image storage and management
- **Search & Filter**: Real-time search functionality across both churches and clergy
- **Responsive Design**: Beautiful UI built with shadcn/ui components and Tailwind CSS
- **RESTful API**: Full CRUD operations for churches and clergy via Next.js API routes
- **MongoDB Integration**: Secure data persistence with MongoDB Atlas

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **File Storage**: Cloudinary
- **UI Components**: shadcn/ui, Tailwind CSS
- **Icons**: Lucide React
- **Animations**: Framer Motion

## Project Structure

```
church-directory/
├── app/
│   ├── api/
│   │   ├── churches/
│   │   │   ├── route.ts              # GET all, POST church
│   │   │   └── [id]/route.ts         # GET, PUT, DELETE by ID
│   │   ├── pastors/
│   │   │   ├── route.ts              # GET all, POST pastor
│   │   │   └── [id]/route.ts         # GET, PUT, DELETE by ID
│   │   └── upload/route.ts           # Cloudinary upload endpoint
│   ├── churches/
│   │   ├── page.tsx                  # Churches list view
│   │   └── [id]/page.tsx             # Church details view
│   ├── clergy/
│   │   ├── page.tsx                  # Clergy list view
│   │   └── [id]/page.tsx             # Clergy details view
│   ├── layout.tsx                    # Root layout with navigation
│   ├── page.tsx                      # Home page
│   └── globals.css                   # Global styles
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── ChurchCard.tsx                # Church card component
│   └── PastorCard.tsx                # Pastor card component
├── lib/
│   ├── mongodb.ts                    # MongoDB connection utility
│   ├── utils.ts                      # Helper functions
│   └── mock-data.ts                  # Mock data for development
├── models/
│   ├── Church.ts                     # Mongoose Church schema
│   └── Pastor.ts                     # Mongoose Pastor schema
├── types/
│   └── entities.ts                   # TypeScript interfaces
└── .env                              # Environment variables
```

## Getting Started

### Prerequisites

- Node.js 18+ installed
- MongoDB Atlas account (free tier available)
- Cloudinary account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   cd church-directory
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Your `.env` file should contain:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_URL=your_cloudinary_url
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Churches

- `GET /api/churches` - Get all churches
- `POST /api/churches` - Create a new church
- `GET /api/churches/[id]` - Get a specific church
- `PUT /api/churches/[id]` - Update a church
- `DELETE /api/churches/[id]` - Delete a church

### Pastors/Clergy

- `GET /api/pastors` - Get all pastors
- `POST /api/pastors` - Create a new pastor
- `GET /api/pastors/[id]` - Get a specific pastor
- `PUT /api/pastors/[id]` - Update a pastor
- `DELETE /api/pastors/[id]` - Delete a pastor

### Upload

- `POST /api/upload` - Upload image to Cloudinary (multipart/form-data)

## Data Models

### Church
```typescript
{
  id: string;
  name: string;
  location: string;
  images: string[];
  head_pastor: string;
  members: number;
  income: number;
}
```

### Pastor
```typescript
{
  id: string;
  name: string;
  age: number;
  position: string;
  profile_image: string;
  clergy_type: "Bishop" | "Mother" | "Sister" | "Reverend" | "Pastor" | "Basonta Leader" | "Governor";
  marital_status: "Single" | "Married" | "Divorced" | "Widowed";
  church: string; // Church ID reference
}
```

## Development

### Adding New Components

shadcn/ui components can be added using:
```bash
npx shadcn@latest add [component-name]
```

### Database Seeding

Mock data is available in `lib/mock-data.ts` for development purposes.

## Deployment

This project can be deployed to:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- Any Node.js hosting platform

Make sure to set environment variables in your deployment platform.

## License

MIT

## Support

For issues or questions, please open an issue in the repository.

