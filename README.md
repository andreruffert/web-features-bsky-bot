# Web Features Bluesky Bot

Automatically posts updates from the [Web Features Explorer](https://web-platform-dx.github.io/web-features-explorer/) to [Bluesky](https://bsky.app/profile/web-features.bsky.social).

The bot monitors two RSS feeds:

- [**Baseline newly available**](https://web-platform-dx.github.io/web-features-explorer/newly-available.xml) - newly available feature updates
- [**Baseline widely available**](https://web-platform-dx.github.io/web-features-explorer/widely-available.xml) - widely available feature updates

Each feed has its own cache to track previously processed entries and avoid reposting them.
