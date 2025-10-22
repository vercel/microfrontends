export interface Article {
  id: number;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
}

export const articles: Article[] = [
  {
    id: 1,
    title: 'Getting Started with Microfrontends',
    excerpt:
      'Learn the basics of microfrontends and how they can benefit your large-scale applications.',
    author: 'Alice Johnson',
    date: '2023-05-15',
    readTime: '5 min read',
  },
  {
    id: 2,
    title: 'Best Practices for Microfrontend Architecture',
    excerpt:
      'Discover key principles and patterns for building scalable and maintainable microfrontend systems.',
    author: 'Bob Smith',
    date: '2023-05-22',
    readTime: '8 min read',
  },
  {
    id: 3,
    title: 'Microfrontends vs Monoliths: A Comparative Analysis',
    excerpt:
      'Explore the pros and cons of microfrontends compared to traditional monolithic architectures.',
    author: 'Charlie Brown',
    date: '2023-05-29',
    readTime: '6 min read',
  },
];
