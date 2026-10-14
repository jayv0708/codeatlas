import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";

import { authConfig } from "@/services/auth.config";
import { prisma } from "@/services/db";

/**
 * Full Auth.js instance (Node.js runtime — safe to import the Prisma adapter
 * here; never import this file from edge middleware).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  events: {
    /**
     * Persist fresh OAuth tokens on every sign-in.
     *
     * PrismaAdapter only calls `linkAccount` for NEW accounts. When an
     * existing user re-authenticates (e.g. to grant the `repo` scope),
     * the adapter logs them in but silently discards the new token. This
     * event handler patches that gap by explicitly updating the Account
     * row with the latest access_token, scope, and related fields.
     */
    signIn: async ({ account }) => {
      if (account?.provider && account.providerAccountId) {
        try {
          await prisma.account.updateMany({
            where: {
              provider: account.provider,
              providerAccountId: account.providerAccountId,
            },
            data: {
              access_token: account.access_token ?? undefined,
              refresh_token: account.refresh_token ?? undefined,
              expires_at: account.expires_at ?? undefined,
              token_type: account.token_type ?? undefined,
              scope: account.scope ?? undefined,
              id_token: account.id_token ?? undefined,
              session_state: (account.session_state as string) ?? undefined,
            },
          });
          console.log(
            `[Auth Event] Updated Account tokens for provider=${account.provider} providerAccountId=${account.providerAccountId} scope=${account.scope ?? "none"}`,
          );
        } catch (error) {
          console.error(
            "[Auth Event] Failed to update Account tokens:",
            error instanceof Error ? error.message : error,
          );
        }
      }
    },
  },
});
