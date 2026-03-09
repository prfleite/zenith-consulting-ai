import { toast } from "@/hooks/use-toast";

/**
 * Global error handler for Supabase queries.
 * Wraps a promise and shows a toast on error.
 */
export async function withErrorHandling<T>(
  promise: Promise<{ data: T; error: any }>,
  errorTitle = "Erro ao carregar dados"
): Promise<T | null> {
  const { data, error } = await promise;
  if (error) {
    console.error(errorTitle, error);
    toast({
      title: errorTitle,
      description: error.message || "Tente novamente mais tarde.",
      variant: "destructive",
    });
    return null;
  }
  return data;
}

/**
 * Global error handler for async operations (edge functions, etc).
 */
export async function withAsyncErrorHandling<T>(
  fn: () => Promise<T>,
  errorTitle = "Erro inesperado"
): Promise<T | null> {
  try {
    return await fn();
  } catch (error: any) {
    console.error(errorTitle, error);
    toast({
      title: errorTitle,
      description: error.message || "Tente novamente mais tarde.",
      variant: "destructive",
    });
    return null;
  }
}
