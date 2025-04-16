# Real-Time Chat Application

A modern, feature-rich real-time chat application built with React, Node.js, and Socket.IO.

## Features

- Real-time messaging using Socket.IO
- User authentication and authorization
- File sharing and uploads
- Emoji support
- Message history
- User avatars and profiles
- Responsive design with modern UI components
- Real-time typing indicators [WIP]

## Tech Stack

### Frontend (Client)
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Shadcn UI for accessible components
- React Query for data fetching
- Socket.IO client for real-time communication
- React Router for navigation
- Zustand for state management
- React Hook Form with Zod for form validation
- Day.js for date formatting

### Backend (Server)
- Node.js with Express
- TypeScript
- Socket.IO for real-time communication
- Drizzle ORM with MySQL/PostgreSQL
- JWT for authentication
- Multer for file uploads
- Bcrypt for password hashing
- Sentry for error tracking
- CORS support

## Prerequisites

- Node.js (Client: v22.9.0, Server: v18.15.0)
- MySQL or PostgreSQL database
- npm or yarn package manager

## Getting Started

1. Clone the repository
```bash
git clone <repository-url>
cd chatapp
```

2. Set up the server
```bash
cd server
npm install
cp .env.example .env  # Configure your environment variables
npm run db:push      # Set up the database
npm run dev          # Start the development server
```

3. Set up the client
```bash
cd client
npm install
cp .env.example .env  # Configure your environment variables
npm run dev          # Start the development server
```

## Environment Variables

### Server (.env)
- `DATABASE_URL`: Your database connection string
- `JWT_SECRET`: Secret key for JWT token generation
- `PORT`: Server port (default: 3000)
- Other configuration variables as needed

### Client (.env)
- `VITE_API_URL`: Backend API URL
- `VITE_SOCKET_URL`: WebSocket server URL

## Scripts

### Server
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run start`: Start production server
- `npm run db:push`: Push database schema changes
- `npm run db:studio`: Open Drizzle Studio

### Client
- `npm run dev`: Start development server
- `npm run build`: Build for production
- `npm run preview`: Preview production build
- `npm run lint`: Run ESLint

## Project Structure

```
chatapp/
├── client/                # Frontend application
│   ├── src/               # Source files
│   ├── app/               # Application components
│   └── public/            # Static files
│
└── server/                # Backend application
    ├── src/               # Source files
    └── drizzle/           # Database migrations
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License.

## Author

Lesley Banadzem

---
