import Image from "next/image";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/lib/repository";
import { formatDate } from "@/lib/utils";

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <section className="section">
      <div className="container blog-detail">
        <p className="eyebrow">{post.category}</p>
        <h1>{post.title}</h1>
        <p className="blog-meta">
          {formatDate(post.publishedAt)} • {post.readTime}
        </p>
        <div className="blog-cover">
          <Image src={post.cover} alt={post.title} fill sizes="100vw" />
        </div>
        <div className="card blog-content">
          {post.content.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      </div>
    </section>
  );
}

