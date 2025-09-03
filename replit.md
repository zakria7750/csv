# Overview

This is a webinar attendee data processing application built with React frontend and Express.js backend. The application allows users to upload CSV files containing webinar attendee data, processes and validates the data, identifies duplicates and errors, and provides tools for data management and analysis. The interface supports both Arabic and English content, making it suitable for multilingual environments.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Internationalization**: Supports Arabic and English with Google Fonts (Noto Sans Arabic, Inter)

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **File Processing**: Multer for file uploads, XLSX library for CSV/Excel parsing
- **Storage Pattern**: Interface-based storage abstraction with in-memory implementation
- **API Design**: RESTful endpoints with proper error handling and logging middleware
- **Development**: Custom Vite integration for seamless development experience

## Data Storage Solutions
- **Primary Database**: PostgreSQL with Neon serverless driver
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Tables**: 
  - `webinar_attendees` - stores processed attendee data with validation flags
  - `csv_files` - tracks uploaded files and processing statistics
- **Storage Abstraction**: IStorage interface allows switching between memory and database storage

## Validation and Processing
- **Data Validation**: Zod schemas for type-safe validation
- **CSV Processing**: Custom parser that handles Arabic and English headers
- **Duplicate Detection**: Email-based duplicate identification with grouping
- **Error Handling**: Comprehensive error reporting with specific validation messages
- **Statistics Tracking**: Real-time processing statistics (total, valid, duplicate, error records)

## Authentication and Authorization
- **Session Management**: Express sessions with PostgreSQL session store (connect-pg-simple)
- **Security**: CORS handling and secure session configuration
- **Current State**: Basic session infrastructure in place, ready for authentication implementation

# External Dependencies

## Core Framework Dependencies
- **@vitejs/plugin-react** - React support for Vite
- **express** - Web framework for Node.js
- **react** and **react-dom** - React library and DOM bindings
- **typescript** - TypeScript compiler and tooling

## Database and ORM
- **drizzle-orm** - TypeScript ORM for SQL databases
- **drizzle-kit** - Migration and schema management tool
- **@neondatabase/serverless** - Neon PostgreSQL serverless driver
- **connect-pg-simple** - PostgreSQL session store for Express

## UI and Styling
- **@radix-ui/react-*** - Comprehensive set of unstyled, accessible UI components
- **tailwindcss** - Utility-first CSS framework
- **class-variance-authority** - Variant-driven component styling
- **lucide-react** - Icon library

## Data Processing and Validation
- **zod** - TypeScript-first schema validation
- **react-hook-form** - Performant form library
- **@hookform/resolvers** - Resolvers for form validation
- **xlsx** - Excel/CSV file processing library
- **multer** - File upload middleware

## State Management and API
- **@tanstack/react-query** - Server state management
- **wouter** - Minimalist routing library

## Development Tools
- **@replit/vite-plugin-runtime-error-modal** - Development error overlay
- **@replit/vite-plugin-cartographer** - Replit-specific development tooling
- **tsx** - TypeScript execution environment

## Utilities
- **date-fns** - Date manipulation library
- **clsx** and **tailwind-merge** - Conditional CSS class utilities
- **nanoid** - Unique ID generation