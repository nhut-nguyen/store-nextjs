import { NewsCard } from "@/components/news-card";
import { getBlogPosts } from "@/lib/repository";

export default async function BlogPage() {
  const posts = await getBlogPosts();

  return (
    <section className="section">
      <div className="container">
        <div className="page-head">
          <p className="eyebrow">Blog công nghệ</p>
          <h1>Tin tức, review và tư vấn mua hàng</h1>
        </div>
        <div className="news-grid">
          {posts.map((post) => (
            <NewsCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </section>
  );
}

