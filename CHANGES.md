# reWear – change log (4 requested features)

Could not run `npm install` / build here (no network). Code is NOT build-tested. Run `npm install && npm run dev` and test.

## Files changed
| File | Change |
|---|---|
| `src/lib/api.ts` | Token gets `ch` claim on Charity Login. `login` accepts `accountType:'charity'` (only role=charity passes). New `POST /api/auth/register-charity`. New `PATCH /api/charity/me` (charity-login session only). New public `GET /api/public/charities` (no sign-in, no private data). Charities in bootstrap get `location`, `hostUserId`. |
| `src/services/storage.ts` | `auth()` accepts `register-charity`; `isCharitySession`, `updateCharity()`, `fetchPublicCharities()`. |
| `src/context/AuthContext.tsx` | Signed-out users see `PublicEntry` (landing first). Adds `isCharityHost`. |
| `src/components/AuthGate.tsx` | Adds **User Login / Charity Login** toggle, charity register form, back button. User login unchanged. |
| `src/components/PublicEntry.tsx` (new) | Landing page, Login/Sign In button, public Charities list, Charity Login link. |
| `src/components/MessagesView.tsx` | Search bar (name / email prefix / student id), "No users found", opens existing thread (no duplicates), accepts `initialWithId`. |
| `src/components/ItemDetailModal.tsx` | "Message Owner" button beside seller; hidden for own item. |
| `src/components/CharityView.tsx` | "Message Charity" button per charity; charity-host edit panel (only in Charity Login session). |
| `src/types/index.ts` | `CharityFoundation` gets optional `location`, `hostUserId`. |
| `src/App.tsx` | `openMessageWith()` -> goes to Messages with chosen user; passes props. |

## Database
No schema change. Uses existing `user.role`, `user.foundation_id`, `charity_foundation`, `message`.
Charity register inserts one `charity_foundation` row (status `active`) + one `user` row (role charity).

## How to test
1. Open site signed out -> landing shows. Click Login / Sign In, Explore Charities.
2. Messages -> type a name in search -> click result -> thread opens. Repeat -> same thread. Gibberish -> "No users found".
3. Open an item -> "Message Owner" -> Messages opens with owner. Own item -> no button.
4. Landing -> Charity Login -> Register charity -> lands in app. Charity page shows "Manage your charity profile". Regular login -> no panel; `PATCH /api/charity/me` returns 403.
5. Other user -> Charity page -> "Message Charity".

## Known limits
- No logo upload (no DB column); logo is generated from name.
- Self-registered charities are public at once (status `active`, shows "University Verified" badge in existing card). Add approval later if wanted.
- Charity hosts messaged only if a `user` row with that `foundation_id` exists (seed charities may have none).
- Existing charity-role users logging in with normal login keep old behavior but cannot manage the profile.
- Logged-in users do not get a link back to landing page.
