import Image from "next/image";
import Link from "next/link";
import { BlogPost } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function NewsCard({ post }: { post: BlogPost }) {
  return (
    <article className="card news-card">
      <div className="news-media">
        <Image src={post.cover} alt={post.title} fill sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      <div className="news-body">
        <span className="pill">{post.category}</span>
        <h3>
          <Link href={`/blog/${post.slug}`}>{post.title}</Link>
        </h3>
        <p>{post.excerpt}</p>
        <small>
          {formatDate(post.publishedAt)} • {post.readTime}
        </small>
      </div>
    </article>
  );
}

