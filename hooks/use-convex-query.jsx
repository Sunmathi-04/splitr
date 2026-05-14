import { useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

export const useConvexQuery = (query, args) => {
  const shouldSkip = args === "skip";

  const result = useQuery(
    query,
    shouldSkip ? "skip" : args
  );

  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (shouldSkip) {
      setIsLoading(true);
      return;
    }

    if (result === undefined) {
      setIsLoading(true);
    } else {
      setData(result);
      setError(null);
      setIsLoading(false);
    }
  }, [result, shouldSkip]);

  return { data, isLoading, error };
};

/* ───────────── MUTATION (UNCHANGED) ───────────── */

export const useConvexMutation = (mutation) => {
  const mutationFn = useMutation(mutation);
  const [data, setData] = useState(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const mutate = async (...args) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await mutationFn(...args);
      setData(response);
      return response;
    } catch (err) {
      setError(err);
      toast.error(err.message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return { mutate, data, isLoading, error };
};
