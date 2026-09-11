import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function useSessionCheck() {
  const router = useRouter();

  useEffect(() => {
    const checkSession = () => {
      try {
        const userSession = localStorage.getItem("userSession");
        if (!userSession) {
          router.push("/?expired=true");
          return;
        }

        const session = JSON.parse(userSession);
        const expiresAt = session.user?.expiresAt || session.expiresAt;

        if (expiresAt && Date.now() > expiresAt) {
          // Session expired
          localStorage.clear();
          sessionStorage.clear();
          router.push("/?expired=true");
        }
      } catch (error) {
        // Invalid session
        localStorage.clear();
        router.push("/?expired=true");
      }
    };

    // Check immediately
    checkSession();

    // Check every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);

    // Check on visibility change (tab focus)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSession();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router]);
}
