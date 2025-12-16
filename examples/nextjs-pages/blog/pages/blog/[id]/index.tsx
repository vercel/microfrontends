import type { GetStaticProps } from 'next';
import { Link } from '@vercel/microfrontends/next/client';
import { BlogHeader } from '@/components/header';
import type { Article } from '@/lib/blog-data';
import { articles } from '@/lib/blog-data';
import { LoremIpsum } from '@/components/lorem-ipsum';

export const getStaticPaths = () => {
  return {
    fallback: false,
    paths: articles.map((article) => `/blog/${article.id}`),
  };
};

export const getStaticProps = ((context) => {
  const article = articles.find(
    (a) => a.id === parseInt(String(context.params?.id ?? -1), 10),
  );
  if (!article) {
    throw new Error('Article not found');
  }
  return { props: { article } };
}) satisfies GetStaticProps<{
  article: Article;
}>;

export default function BlogPost({ article }: { article: Article }) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <BlogHeader />
      <main className="max-w-5xl container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          className="text-primary hover:underline mb-4 inline-block"
          href="/blog"
        >
          &larr; Back to Blog
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl">{article.title}</h1>
          <div className="text-sm text-muted-foreground">
            <p>
              {article.author} • {article.date} • {article.readTime}
            </p>
          </div>
          <div className="prose max-w-none mt-4">
            <LoremIpsum />
          </div>
        </div>
      </main>
    </div>
  );
}
