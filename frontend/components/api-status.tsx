"use client";

import { useEffect, useState } from "react";
import { apiStatus } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function ApiStatus() {
  const [status, setStatus] = useState<"online" | "offline" | "loading">("loading");
  const [version, setVersion] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const result = await apiStatus.checkStatus();
        setStatus(result.status === "online" ? "online" : "offline");
        setVersion(result.version);
        setError(null);
      } catch (err) {
        setStatus("offline");
        setError("Could not connect to API server");
        console.error("API status check failed:", err);
      }
    };

    checkApiStatus();
    // Check API status every 30 seconds
    const interval = setInterval(checkApiStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          API Status
          {status === "loading" && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
          {status === "online" && (
            <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
              Online
            </Badge>
          )}
          {status === "offline" && (
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">
              Offline
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {error ? error : status === "online" ? `API v${version}` : "Checking connection..."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {status === "online" 
            ? "Connected to Sports-Intel API"
            : status === "offline" 
              ? "Could not connect to the Sports-Intel API. Please ensure the backend is running."
              : "Checking connection to Sports-Intel API..."}
        </p>
      </CardContent>
    </Card>
  );
}
