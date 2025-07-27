# APR Dashboard

A modern web dashboard built with React, Vite, shadcn/ui, and Supabase for visualizing historical APR (Annual Percentage Rate) data from DeFi protocols.

## Features

- 📊 Interactive charts showing APR trends over time
- 🔍 Filter by protocol to focus on specific data
- 📈 Real-time statistics including highest, lowest, and average APR
- 🎨 Modern UI with shadcn/ui components
- 📱 Responsive design for desktop and mobile
- ⚡ Fast performance with Vite
- 🔄 Real-time data from Supabase

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS + shadcn/ui
- **Charts**: Recharts
- **Database**: Supabase
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ (recommended)
- A Supabase project with an `apr_history` table

## Database Schema

Create a table called `apr_history` in your Supabase project with the following structure:

```sql
CREATE TABLE apr_history (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  apr DECIMAL(10,4) NOT NULL,
  protocol VARCHAR(100) NOT NULL,
  pool_name VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Setup Instructions

1. **Clone and install dependencies:**
   ```bash
   cd apr-dashboard
   npm install
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## Usage

- **View Charts**: The main dashboard displays APR trends over time
- **Filter Data**: Use the protocol filter buttons to show/hide specific protocols
- **Statistics**: View key metrics at the top of the dashboard
- **Refresh**: Click the refresh button to fetch the latest data

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── APRChart.tsx     # Main chart component
│   ├── Dashboard.tsx    # Main dashboard layout
│   ├── ProtocolFilter.tsx # Protocol filtering
│   └── Statistics.tsx   # Statistics cards
├── lib/
│   ├── supabase.ts     # Supabase client configuration
│   └── utils.ts        # Utility functions
└── App.tsx             # Main app component
```

## Customization

- **Colors**: Modify the color scheme in `src/index.css`
- **Chart Types**: Replace Recharts components in `APRChart.tsx`
- **Data Source**: Update `supabase.ts` to connect to different tables
- **Styling**: Customize Tailwind classes throughout components

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.
