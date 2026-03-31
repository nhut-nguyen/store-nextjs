import Link from "next/link";

export default function NotFound() {
  return (
    <section className="section">
      <div className="container">
        <div className="empty-state card">
          <h1>Không tìm thấy nội dung</h1>
          <p>Trang bạn yêu cầu không tồn tại hoặc đã được di chuyển.</p>
          <Link href="/" className="primary-button">
            Về trang chủ
          </Link>
        </div>
      </div>
    </section>
  );
}

