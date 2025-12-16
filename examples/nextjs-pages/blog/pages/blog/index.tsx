import { BlogList } from '@/components/blog-list';
import { BlogHeader } from '@/components/header';
import { type Article, articles as articleData } from '@/lib/blog-data';

export function getStaticProps() {
  return {
    props: {
      articles: articleData,
    },
  };
}

export default function Blog({ articles }: { articles: Article[] }) {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <BlogHeader />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <BlogList articles={articles} />
      </main>
    </div>
  );
}
