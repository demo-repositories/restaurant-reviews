# Views

A Turborepo monorepo containing a Sanity Studio for managing restaurants
(`apps/studio`) and a Next.js frontend (`apps/web`) that lets users browse and
search them.

This README focuses on the **search** experience: the page, the GROQ query, the
API route, and the client-side behaviour. For everything else in the project,
see the package-level READMEs and `turbo.json`.

## Where it lives

```
apps/web/
├── app/
│   ├── search/page.tsx          # /search route (server component)
│   └── api/search/route.ts      # GET /api/search (route handler)
├── components/
│   └── SearchPage.tsx           # Client component, input + results
└── sanity/
    ├── queries.ts               # SEARCH_QUERY (GROQ)
    ├── data.ts                  # searchRestaurants() helper
    └── client.ts                # Sanity client (useCdn: true)
```

## What you can do

Visit `/search` (or click **Search** from the homepage) to:

- Type a restaurant name (e.g. `pizza`) and see ranked matches as you type.
- Share a search by URL — `/search?q=pizza` renders results on the server, so
  the link opens straight to a populated list.
- Use the back/forward buttons; the query is kept in sync with the URL.
- Press **Esc** in the search input or click the **×** button to clear it.

## How it works

```
              ┌──────────────────┐
   typing ──► │ SearchPage (UI)  │
              │  debounce 250ms  │
              │  AbortController │
              └────────┬─────────┘
                       │ fetch(`/api/search?q=…`)
                       ▼
              ┌──────────────────┐
              │ /api/search      │ (route handler, server-side)
              │  searchRestaurants(q)
              └────────┬─────────┘
                       │ GROQ + parameter $q
                       ▼
              ┌──────────────────┐
              │ Sanity Content   │
              │ Lake (CDN)       │
              └──────────────────┘
```

Shareable URLs work because `/search/page.tsx` is a server component that calls
the same `searchRestaurants(q)` helper for the initial render when `?q=` is
present.

## The GROQ query

`SEARCH_QUERY` lives in `apps/web/sanity/queries.ts`:

```55:84:apps/web/sanity/queries.ts
export const SEARCH_QUERY = defineQuery(`
*[_type == "restaurant"] | score(
    restaurant_name match $q
) [0...100] {
  _id,
  restaurant_name,
  avg_rating,
  gluten_free,
  "locations": locations[]->{
    _id,
    city,
    region,
    country,
    latitude,
    longitude,
    address
  },
  "cuisines": cuisines[]->{
    _id,
    name
  },
  "top_tags": top_tags[]->{
    _id,
    name
  },
  "features": features[]->{
    _id,
    name
  }
}`)
```

A few things worth knowing:

- **`score()`** is GROQ's relevance-ranking pipeline component. Every restaurant
  is passed through, but the higher its `restaurant_name match $q` score, the
  earlier it appears. Documents that don't match get a score of `0` and are
  filtered out by the slice at the end (`[0...100]`).
- **`match`** does whole-word matching by default. `$q = "pizza"` matches any
  field whose tokenized words include `pizza`, but `"piz"` won't match
  `Pizzeria`. It is also not a substring search — `"izza"` won't match
  `"Pizza"`. To get prefix matching, append `*` to the value before sending it
  (e.g. `"piz*"` matches `Pizzeria`); see _Passing the query to Sanity_ below
  for where to do that.
- **`$q`** is always passed as a parameter, never interpolated.
- The projection follows the rest of the codebase: every required attribute is
  listed explicitly, references are dereferenced one level (`->{…}`), and the
  query is wrapped in `defineQuery` for type-friendliness.

## Passing the query to Sanity

`searchRestaurants(query)` in `apps/web/sanity/data.ts` is intentionally thin:

```15:23:apps/web/sanity/data.ts
/**
 * Search restaurants via Sanity using the GROQ `@ match` operator.
 */
export async function searchRestaurants(query: string): Promise<Restaurant[]> {
  const trimmed = query.trim()


  return sanityClient.fetch<Restaurant[]>(SEARCH_QUERY, {q: trimmed}, {method: 'POST'})
}
```

- The user's input is **trimmed** but otherwise sent verbatim as the `$q`
  parameter — no wildcard expansion, no token splitting.
- Because there is no `*` suffix, `match` behaves as **whole-word match**:
  `match $q` with `$q = "pizza"` finds documents whose `restaurant_name`
  contains the word `pizza` as a complete token. `"piz"` won't match
  `Pizzeria`.
- Empty queries are filtered out **before** this function runs, in
  `app/api/search/route.ts` (the `if (!q) return NextResponse.json({results:
[], q})` branch). So `searchRestaurants` itself doesn't guard against an
  empty string — by the time it's called, you've already got a meaningful
  query.
- If you want prefix matching back (`"piz"` -> `"piz*"`), tack a `*` on the
  end before passing the value to `fetch`. If you want each whitespace-
  separated word treated independently, pass an array instead of a string —
  `match` interprets an array as "all of these must match".

> **Multi-word caveat:** a multi-word query like `"thai london"` is sent as a
> single string. `match` will only consider it a hit if `thai london` appears
> as adjacent words in the field. Today `SEARCH_QUERY` ranks on
> `restaurant_name`, so the two-words-across-different-fields problem doesn't
> bite, but it becomes important if you extend the query to also match
> cuisines/locations/etc. See _Extending_ below.

## The API route

`apps/web/app/api/search/route.ts` is a thin handler:

```1:22:apps/web/app/api/search/route.ts
import {NextResponse, type NextRequest} from 'next/server'
import {searchRestaurants} from '@/sanity/data'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (!q) {
    return NextResponse.json({results: [], q})
  }

  try {
    const results = await searchRestaurants(q)
    return NextResponse.json(
      {results, q},
      {headers: {'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'}},
    )
  } catch (error) {
    console.error('Search failed', error)
    return NextResponse.json({error: 'Search failed', q}, {status: 500})
  }
}
```

- Reads `?q=` from the URL.
- Returns `{results, q}` on success.
- Sets `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` so
  repeat searches don't hammer Sanity. The Sanity client itself uses the CDN
  (`useCdn: true`), so the data is already on a fast path.
- Returns `{error, q}` with HTTP 500 on failure so the client can show an
  error state rather than silently dying.

You can hit it manually:

```bash
curl 'http://localhost:3000/api/search?q=pizza'
```

## The client UI

`apps/web/components/SearchPage.tsx` is the only client component. Behaviour
worth noting:

| Concern       | How it's handled                                                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Debounce      | A 250 ms `setTimeout` wraps each fetch so quick typing doesn't fire a request per keystroke.                                                                            |
| Cancellation  | Each fetch carries an `AbortController`; a new keystroke aborts the previous request so the latest one always wins.                                                     |
| URL sync      | The current query is mirrored to `?q=` with `router.replace` (no scroll, no history spam).                                                                              |
| SSR           | If `?q=` is present in the URL, `/search/page.tsx` calls `searchRestaurants` on the server and seeds `initialResults` so the page is useful before JavaScript hydrates. |
| Empty input   | Renders an "Start typing to search" empty state and clears any URL query string.                                                                                        |
| No matches    | Renders a quoted "No results for …" prompt.                                                                                                                             |
| Errors        | Renders a red banner; the input keeps working so the user can try again.                                                                                                |
| Highlighting  | Matched tokens in the result name and address are wrapped in `<mark>` for visual confirmation.                                                                          |
| Accessibility | The input has `aria-label`, `type="search"`, the clear button has `aria-label="Clear search"`, and the loading state has `aria-label="Loading"`.                        |

## Extending the search

The query is intentionally small. Common extensions:

### Search additional fields (description, review)

Add more match expressions inside `score(…)`. each match adds additional points to the score

```groq
*[_type == "restaurant"] | score(
  restaurant_name match $q,
  description match $q,
  pt::text(review) match $q
) [_score > 0][0...100] { … }
```

The `[_score > 0]` filter is important once you add non-name fields: without
it, `score()` keeps every document with a score of `0` and you'll see
unrelated results pad out the bottom of the list.

### use `text::query`

`text::query()` parses a search string into a structured query (supporting phrases, term exclusion, and wildcards) that you pass to match on the right-hand side. The match operator does the searching; text::query() is what lets you express a richer query than a plain string can.

```groq
*[_type == "restaurant"] | score(
  restaurant_name match text::query($q),
  description match text::query($q),
  pt::text(review) match text::query($q)
) [_score > 0][0...100] { … }
```

### search by relevancy

Semantic search finds documents by meaning rather than exact keyword matches. It uses vector embeddings generated by a language model to understand the intent behind your query. Use it for "find similar" features, content discovery, or any time the user phrases a query in natural language.

Requires dataset embeddings to be enabled and then will check the relevancy against any fields that are included in the embeddings projection (or all fields if no projections)

```groq
*[_type == "restaurant"] | score(text::semanticSimilarity($q))

```

### Set weighting for certain fields

in `score(...)` you can use the `boost` function to set a weight for an expression

```groq
*[_type == "restaurant"] | score(
  boost(restaurant_name match text::query($q),3),
  boost(description match text::query($q),2),
  pt::text(review) match text::query($q)
) [_score > 0][0...100] { … }
```

### Hybrid search

Combines both text matches and semantic search. Use weighting to refine the experince

```groq
*[_type == "restaurant"] | score(
  boost(text::semanticSimilarity($q),2)
  boost(restaurant_name match text::query($q),5),
  boost(description match text::query($q),3),
  pt::text(review) match text::query($q)
) [_score > 0][0...100]
```

### Search term highlighting

on vX there is now `text::highlight()` that returns information about which parts of a document matched the search query, enabling you to show relevant snippets in search results.

it takes 2 arguments, document and query that needs to be use `text::query()`

```groq
*[_type == "restaurant"] | score(
  boost(text::semanticSimilarity($q),5),
  boost(restaurant_name match text::query($q),3),
  boost(description match text::query($q),2),
) [_score > 0][0...100]{
  restaurant_name,
  description,
   "highlights": text::highlight(@, text::query($q))
}
```

### Server-side filtering on top of search

The `/api/search` route returns the full hit list. If you want to also apply
filters from the home page (cuisine, tag, feature, distance), pass them as
additional query params and add them to the GROQ filter — keep them in
`SEARCH_QUERY` as optional predicates: `(!defined($cuisineIds) || count(cuisines[@._ref in $cuisineIds]) > 0)`.

### Caching

The route's `s-maxage=60` is conservative. If your dataset doesn't change
often, bump it. If it does, lower it. The Sanity CDN already absorbs most of
the load — the route cache is mostly to avoid an extra hop for popular
queries.

## Running locally

```bash
# install once
yarn install --ignore-engines

# start everything (studio + web)
yarn dev

# or just the web app
yarn workspace web dev
```

The web app reads Sanity configuration from
`apps/web/.env.local` (see `.env.local.example`); it falls back to the project's
known values if the env vars aren't set, so it works out of the box for
development.

## Known limitations

- **No diacritic / Unicode folding.** `Café` and `Cafe` are treated as
  different words. Sanity's `match` is case-insensitive but ASCII-folding is
  not built in.
- **Whole-word only.** The query is sent verbatim, so `match "piz"` won't find
  `Pizzeria`. Append `*` in `searchRestaurants` to enable prefix matching, or
  switch to per-token logic if you want each word to expand independently.
  Substring search (matching mid-word) needs a different approach entirely —
  e.g. lowercased searchable fields combined with `string::lower(…) match …`.
- **No spellchecking or fuzzy matching.** A typo returns nothing. If you want
  fuzziness, look at Sanity's full-text search add-on (Algolia, Typesense, or
  Sanity's own search) rather than GROQ.
- **No analytics / popular searches.** The route logs errors to stderr; it
  does not record what users are searching for.
