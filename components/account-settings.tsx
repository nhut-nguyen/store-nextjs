"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/components/providers";

export function AccountSettings() {
  const router = useRouter();
  const { user, setUserSession } = useStore();
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  async function handleProfileSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingProfile(true);
    setProfileMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/account/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        phone: formData.get("phone"),
        address: formData.get("address"),
      }),
    });

    const result = await response.json();
    setProfileMessage(result.message);
    setIsSavingProfile(false);

    if (response.ok && result.user) {
      setUserSession(result.user);
      router.refresh();
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSavingPassword(true);
    setPasswordMessage("");

    const formData = new FormData(event.currentTarget);
    const response = await fetch("/api/account/password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: formData.get("currentPassword"),
        newPassword: formData.get("newPassword"),
        confirmPassword: formData.get("confirmPassword"),
      }),
    });

    const result = await response.json();
    setPasswordMessage(result.message);
    setIsSavingPassword(false);

    if (response.ok) {
      event.currentTarget.reset();
    }
  }

  return (
    <div className="account-grid">
      <form className="card form-card" onSubmit={handleProfileSubmit}>
        <h2>Thông tin cá nhân</h2>
        <input name="name" defaultValue={user?.name} placeholder="Họ và tên" required />
        <input name="email" type="email" defaultValue={user?.email} placeholder="Email" required />
        <input name="phone" defaultValue={user?.phone} placeholder="SĐT" required />
        <textarea
          name="address"
          rows={4}
          defaultValue={user?.address}
          placeholder="Địa chỉ nhận hàng"
          required
        />
        <button type="submit" className="primary-button" disabled={isSavingProfile}>
          {isSavingProfile ? "Đang lưu..." : "Cập nhật thông tin"}
        </button>
        {profileMessage ? <p className="helper-text">{profileMessage}</p> : null}
      </form>

      <form className="card form-card" onSubmit={handlePasswordSubmit}>
        <h2>Đổi mật khẩu</h2>
        <input name="currentPassword" type="password" placeholder="Mật khẩu hiện tại" required />
        <input name="newPassword" type="password" placeholder="Mật khẩu mới" required />
        <input name="confirmPassword" type="password" placeholder="Nhập lại mật khẩu mới" required />
        <button type="submit" className="secondary-button" disabled={isSavingPassword}>
          {isSavingPassword ? "Đang đổi..." : "Đổi mật khẩu"}
        </button>
        {passwordMessage ? <p className="helper-text">{passwordMessage}</p> : null}
      </form>
    </div>
  );
}
