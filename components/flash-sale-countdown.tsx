"use client";

import { useEffect, useState } from "react";

type CountdownParts = {
  hours: string;
  minutes: string;
  seconds: string;
};

const initialCountdown: CountdownParts = {
  hours: "00",
  minutes: "00",
  seconds: "00",
};

function getNextFlashDeadline(now: Date) {
  const current = new Date(now);
  const start = new Date(now);
  start.setHours(10, 0, 0, 0);
  const end = new Date(now);
  end.setHours(14, 0, 0, 0);

  if (current < start) {
    return start;
  }

  if (current < end) {
    return end;
  }

  const nextDayStart = new Date(start);
  nextDayStart.setDate(nextDayStart.getDate() + 1);
  return nextDayStart;
}

function getCountdownParts() {
  const now = new Date();
  const deadline = getNextFlashDeadline(now);
  const diff = Math.max(0, deadline.getTime() - now.getTime());

  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  } satisfies CountdownParts;
}

export function FlashSaleCountdown() {
  const [countdown, setCountdown] = useState<CountdownParts>(initialCountdown);

  useEffect(() => {
    setCountdown(getCountdownParts());

    const timer = window.setInterval(() => {
      setCountdown(getCountdownParts());
    }, 1000);

    return () => {
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div className="flash-timer" aria-label="Đồng hồ đếm ngược giờ vàng">
      <div>
        <strong>{countdown.hours}</strong>
        <span>Giờ</span>
      </div>
      <div>
        <strong>{countdown.minutes}</strong>
        <span>Phút</span>
      </div>
      <div>
        <strong>{countdown.seconds}</strong>
        <span>Giây</span>
      </div>
    </div>
  );
}
