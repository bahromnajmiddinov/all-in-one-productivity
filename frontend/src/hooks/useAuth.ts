import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

export const useAuth = () => {
  const store = useAuthStore();

  useEffect(() => {
    if (store.isAuthenticated && !store.user && !store.isLoading) {
      store.fetchUser();
    }
  }, [store.isAuthenticated, store.user, store.isLoading]);

  return store;
};
