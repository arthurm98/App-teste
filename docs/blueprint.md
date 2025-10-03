# **App Name**: MangaTrack

## Core Features:

- Library Management: Allows users to add and categorize manga, manhwa, and webtoon titles into personal libraries with 'Reading', 'Plan to Read', and 'Completed' lists.
- Reading Progress Tracker: Enables users to track the last read chapter and visually displays reading progress.
- Smart Search: Provides local and online search functionalities to find titles within the user's library or through external APIs.
- API Integration with Fallback: Fetches detailed manga information from external sources like Kitsu, Jikan (MyAnimeList), MangaDex, and AniList, with a priority-based fallback logic.
- Stats Visualizer: Shows statistics of the user's collection, including status distributions and top genres.
- Data Persistence: Saves user data locally with export/import functionality for backup.
- Dark Mode: Allows users to use dark themes for optimal viewing experience.
- PT-BR Language Support: Offers the app interface and content in Brazilian Portuguese.

## Style Guidelines:

- Primary color: Deep indigo (#4B0082) for a sophisticated and immersive reading experience.
- Background color: Light gray (#E0E0E0) to provide a clean and neutral backdrop.
- Accent color: Electric violet (#8F00FF) to highlight interactive elements and important actions.
- Headline font: 'Poppins', a geometric sans-serif for titles and short amounts of text. Body text: 'PT Sans' a humanist sans-serif, to guarantee readability.
- Use simple and intuitive icons from 'react-native-vector-icons' to represent navigation and actions.
- Employ a bottom tab navigator for primary navigation (Home, Library, Search, Statistics) and stack navigation for detail screens.
- Incorporate subtle animations for screen transitions and loading states to enhance user experience.