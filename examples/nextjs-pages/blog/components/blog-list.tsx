import { Link } from '@vercel/microfrontends/next/client';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { Article } from '@/lib/blog-data';

export function BlogList({ articles }: { articles: Article[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto">
      {articles.map((article) => (
        <Card className="flex flex-col" key={article.id}>
          <CardHeader>
            <CardTitle>{article.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground">{article.excerpt}</p>
          </CardContent>
          <CardFooter className="flex justify-between items-center text-sm text-muted-foreground">
            <div>
              <p>{article.author}</p>
              <p>{article.date}</p>
            </div>
            <div>{article.readTime}</div>
          </CardFooter>
          <CardFooter>
            <Link
              className="text-primary hover:underline"
              href={`/blog/${article.id}`}
            >
              Read more
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
