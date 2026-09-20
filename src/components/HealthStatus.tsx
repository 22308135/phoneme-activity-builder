"use client";
import { useEffect, useState } from "react";

export function HealthStatus() {
  const [status, setStatus] = useState("Checking system health…");
  useEffect(() => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    fetch("/health", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        const data = await response.json();
        setStatus(response.ok && data.database === "connected" ? "Healthy · Database connected" : "Warning · System health check failed");
      })
      .catch(() => setStatus("Warning · System health check unavailable"))
      .finally(() => clearTimeout(timeout));
    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);
  return <p role="status" className="dashboard-health">{status}</p>;
}
