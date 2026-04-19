# Folusho Victory Schools - Result Computing Software

A comprehensive, professional result management system built with React, Vite, and Tailwind CSS. Designed for Folusho Victory Schools to manage student records, record test and exam results, calculate grades, and generate detailed reports.

## Features

### 📊 Dashboard
- Real-time overview of school performance
- Quick statistics on total students, active students, and average scores
- School overview by level (Nursery, Primary, Secondary)
- Recent results display

### 👥 Student Management
- Add, edit, and delete student records
- Support for three school levels: Nursery, Primary, and Secondary
- Track student personal information, parent/guardian details
- Filter students by name, email, registration number, and level
- Export student data to CSV
- Student status management (Active, Inactive, Suspended)

### 📝 Result Entry
- Record student test and exam results
- Support for multiple assessment types: Test, Exam, Assignment, Project
- Automatic grade calculation based on score
- Multiple terms support (First, Second, Third)
- Comprehensive search and filtering
- Bulk export of results to CSV
- Built-in grade preview

### 📈 Reports & Analytics
- **Student Performance Reports**: Individual student GPA, average scores, pass rates
- **Class Performance Reports**: Class-wide statistics, average scores, pass/fail rates
- **Subject Analysis Reports**: Subject-wise performance metrics
- Performance rating system (Excellent, Good, Average, Poor, Very Poor)
- Detailed analytics with filtering options

## Technology Stack

- **Frontend Framework**: React 18.2 with TypeScript
- **Build Tool**: Vite 5.0
- **Styling**: Tailwind CSS 3.3
- **Routing**: React Router DOM 6.17
- **Icons**: Lucide React 0.263
- **Date Handling**: Date-fns 2.30

## Project Structure

```
folusho-result-system/
├── src/
│   ├── components/
│   │   ├── StatCard.tsx         # Statistics card component
│   │   ├── Table.tsx             # Reusable table component
│   │   ├── StudentForm.tsx       # Student form modal
│   │   └── ResultForm.tsx        # Result form modal
│   ├── hooks/
│   │   └── useLocalStorage.ts   # Custom local storage hook
│   ├── pages/
│   │   ├── Dashboard.tsx         # Dashboard page
│   │   ├── StudentManagement.tsx # Student management page
│   │   ├── ResultEntry.tsx       # Result entry page
│   │   └── Reports.tsx           # Reports page
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── utils/
│   │   └── calculations.ts      # Utility functions for calculations
│   ├── App.tsx                  # Main app component
│   ├── App.css                  # App styles
│   ├── index.css                # Global styles
│   └── main.tsx                 # Entry point
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── vite.config.ts               # Vite configuration
├── tsconfig.json                # TypeScript configuration
├── tailwind.config.js           # Tailwind CSS configuration
└── postcss.config.js            # PostCSS configuration
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Steps

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   The application will open at `http://localhost:5173`

3. **Build for production**:
   ```bash
   npm run build
   ```

## Deployment Guide (Safe Setup)

This project is configured for a dual-deployment setup (Backend on Render, Frontend on Vercel) to ensure maximum performance and safety.

### 1. Backend Deployment (Render.com)
1. Sign up for a free account at [Render.com](https://render.com).
2. Connect your GitHub repository.
3. Select "New" -> "Blueprint".
4. Render will automatically detect the `render.yaml` file and set up the backend.
5. In the Render dashboard, go to your service and manually add the following **Environment Variables**:
   - `MONGO_URI`: Your MongoDB Atlas connection string.
   - `JWT_SECRET`: A long, random string.
   - `EMAIL_USER` / `EMAIL_PASS`: For email notifications.

### 2. Frontend Deployment (Vercel)
1. Sign up for a free account at [Vercel](https://vercel.com).
2. Connect your GitHub repository.
3. Vercel will detect the `vercel.json` file.
4. Add the following **Environment Variable** in the Vercel dashboard:
   - `VITE_API_URL`: Set this to your Render backend URL (e.g., `https://folusho-backend.onrender.com/api`).
5. Click "Deploy".

### 3. Staging Environment (Testing)
To test new features like **AI Insights** or **Chat** without affecting your live data:
1. Create a second database in MongoDB Atlas (e.g., `folusho_staging`).
2. Deploy a second version of the app using this new database URI.
3. Once satisfied, update your production environment variables to point to the new code.

4. **Preview production build**:
   ```bash
   npm run preview
   ```

## Usage Guide

### Adding Students
1. Navigate to the **Students** section
2. Click **Add Student** button
3. Fill in all required fields (marked with *)
4. Click **Add Student** to save

### Recording Results
1. Go to the **Results** section
2. Click **Add Result** button
3. Select student and subject
4. Enter score and total score (automatic grade calculation)
5. Select term and academic year
6. Click **Record Result** to save

### Viewing Reports
1. Navigate to **Reports** section
2. Select report type:
   - **Student Performance**: Individual student analytics
   - **Class Performance**: Class-wide statistics
   - **Subject Analysis**: Subject performance metrics
3. Use filters for detailed insights

### Exporting Data
- Click **Export** on Student Management or Results pages
- Data exports as CSV file for use in Excel or other applications

## Grade Scale

The system uses the following grade scale:

| Score Range | Grade | Grade Point | Description |
|-------------|-------|-------------|-------------|
| 90-100 | A | 4.0 | Excellent |
| 80-89 | B | 3.0 | Good |
| 70-79 | C | 2.0 | Average |
| 60-69 | D | 1.0 | Below Average |
| 0-59 | F | 0.0 | Fail |

## Data Storage

The application uses browser's local storage to persist data. This means:
- Data is stored locally on the user's browser
- Data persists across browser sessions
- Clearing browser cache will delete all data (use export feature to backup)
- Data is not synced across different browsers or devices

## Features Details

### Automatic Calculations
- **Percentage**: (Score / Total Score) × 100
- **Grade**: Based on percentage and grade scale
- **GPA**: Average of all grade points
- **Performance Rating**: Based on GPA
- **Pass Rate**: Percentage of students scoring 50% or above

### Search & Filter
- Student search by name, email, or registration number
- Filter by school level (Nursery, Primary, Secondary)
- Filter results by term and academic year
- Filter reports by student, class, or subject

## Best Practices

1. **Regular Backups**: Regularly export data to CSV for backup
2. **Data Validation**: The system validates all inputs before saving
3. **Responsive Design**: Works on desktop, tablet, and mobile devices
4. **Professional UI**: Clean, intuitive interface following modern design principles

## Performance Ratings

Based on GPA:
- **Excellent**: GPA ≥ 3.5
- **Good**: GPA ≥ 3.0
- **Average**: GPA ≥ 2.0
- **Poor**: GPA ≥ 1.0
- **Very Poor**: GPA < 1.0

## Troubleshooting

### Data not saving?
- Check if browser local storage is enabled
- Clear browser cache and try again

### Page not loading?
- Ensure all npm dependencies are installed: `npm install`
- Restart the development server: `npm run dev`

### Export not working?
- Ensure pop-ups are allowed in your browser
- Check browser console for errors

## Future Enhancements

- Backend database integration
- Multi-user authentication
- Detailed performance trends
- SMS/Email notifications to parents
- Mobile app version
- Advanced analytics and predictive insights
- Bulk student import from CSV
- Custom report generation

## License

This software is developed for Folusho Victory Schools.

## Support

For support or feature requests, contact the development team.

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Created for**: Folusho Victory Schools
