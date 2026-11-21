import { create } from "zustand";
import { persist } from "zustand/middleware";
import { toggleFavoriteAction } from "@/actions/favorite.actions";

interface FavoritesStoreState {
  favoritedProjectIds: string[];
  favoritedCredentialIds: string[];
  isProjectFavorited: (id: string) => boolean;
  isCredentialFavorited: (id: string) => boolean;
  toggleProjectFavorite: (id: string) => Promise<boolean>;
  toggleCredentialFavorite: (id: string) => Promise<boolean>;
}

export const useFavoritesStore = create<FavoritesStoreState>()(
  persist(
    (set, get) => ({
      favoritedProjectIds: [],
      favoritedCredentialIds: [],

      isProjectFavorited: (id: string) => get().favoritedProjectIds.includes(id),
      isCredentialFavorited: (id: string) => get().favoritedCredentialIds.includes(id),

      toggleProjectFavorite: async (id: string) => {
        const current = get().favoritedProjectIds;
        const willBeFavorited = !current.includes(id);

        // Optimistic update
        set({
          favoritedProjectIds: willBeFavorited
            ? [...current, id]
            : current.filter((item) => item !== id),
        });

        // Persist to server
        try {
          await toggleFavoriteAction({ targetType: "project", targetId: id });
        } catch {
          // Keep optimistic client state
        }

        return willBeFavorited;
      },

      toggleCredentialFavorite: async (id: string) => {
        const current = get().favoritedCredentialIds;
        const willBeFavorited = !current.includes(id);

        // Optimistic update
        set({
          favoritedCredentialIds: willBeFavorited
            ? [...current, id]
            : current.filter((item) => item !== id),
        });

        // Persist to server
        try {
          await toggleFavoriteAction({ targetType: "credential", targetId: id });
        } catch {
          // Keep optimistic client state
        }

        return willBeFavorited;
      },
    }),
    {
      name: "vault-user-favorites",
    }
  )
);
