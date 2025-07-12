import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let text = res.statusText;
    try {
      const responseText = await res.text();
      // Check if response is HTML (error page) or JSON
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        console.error("Received HTML response instead of JSON:", responseText.substring(0, 200));
        text = "Server returned HTML instead of JSON - possible server error";
      } else {
        text = responseText || res.statusText;
      }
    } catch (e) {
      console.error("Failed to read response text:", e);
    }
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  console.log(`Making ${method} request to ${url}`, data ? { data } : "");
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  console.log(`Response status: ${res.status}, headers:`, Object.fromEntries(res.headers.entries()));
  
  // Clone response to read it multiple times
  const resClone = res.clone();
  
  // Check if response is actually JSON
  const contentType = res.headers.get('content-type');
  if (res.ok && !contentType?.includes('application/json')) {
    const text = await resClone.text();
    if (text.includes('<!DOCTYPE') || text.includes('<html>')) {
      console.error("Received HTML response instead of JSON:", text.substring(0, 200));
      throw new Error("Server returned HTML instead of JSON - possible server error");
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "returnNull" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      retry: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
    },
    mutations: {
      retry: false,
    },
  },
});
