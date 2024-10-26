# Audio Library System

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app), featuring an audio library management system.

## Project Instructions

## Getting Started

This project is built using Next.js and includes an audio library system. To get started, follow these steps:

1. Clone the repository to your local machine.
2. Navigate to the project directory in your terminal.
3. Install the dependencies by running:
   ```
   npm install
   ```
   or if you're using Yarn:
   ```
   yarn install
   ```
4. Set up your MySQL database using the `database_setup.sql` file (see Database Setup section).
5. Update the connection details in the `.env.local` file (see Configuration section).
6. Start the development server:
   ```
   npm run dev
   ```
   or with Yarn:
   ```
   yarn dev
   ```
7. Open your browser and visit `http://localhost:3000` to see the application running.

## Database Setup

To set up the database, follow these steps:

1. Make sure you have MySQL installed and running on your system.
2. Open a MySQL client or command-line tool.
3. Run the following command to create and set up the database:
   ```
   mysql -u your_username -p < database_setup.sql
   ```
   Replace `your_username` with your MySQL username. You'll be prompted to enter your password.

## Configuration

Create a `.env.local` file in the root directory with the following content:

```
DB_HOST=your_database_host
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_NAME=audio_library
```

Replace the placeholders with your actual MySQL database credentials.

## Project Structure

The main application code is located in the `src` directory. Key files and directories include:

- `src/app/page.tsx`: Main page component
- `src/components/`: React components for the audio library system
- `src/pages/api/`: API routes for handling database operations
- `src/lib/db.js`: Database connection utility
- `database_setup.sql`: SQL file for setting up the database

## Features

The Audio Library System includes the following features:

1. Add new audio entries with program name, date, category, and description
2. Upload audio files to the server and store references in the MySQL database
3. View and manage existing audio entries
4. Play uploaded audio files directly from the browser

## Making Changes

To make changes to the application:

1. Modify the components in the `src/components/` directory.
2. Update API routes in the `src/pages/api/` directory for backend functionality.
3. Adjust the main page layout in `src/app/page.tsx`.
4. Save your changes, and the development server will automatically reload with your updates.

## Building for Production

When you're ready to build the application for production, run:

```
npm run build
```
or with Yarn:
```
yarn build
```

This will create an optimized production build in the `.next` directory.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## File Upload Configuration

The application uses a local directory to store uploaded audio files. The upload directory is located at:

```
public/uploads/
```

Make sure this directory exists and has the proper write permissions for the application to store uploaded files.

Note: The contents of the `uploads` directory are ignored by Git to prevent large binary files from being tracked in version control. Only the `.gitkeep` file is committed to ensure the directory structure is maintained.
