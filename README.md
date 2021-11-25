<img align="right" width="30%" src="https://github.com/floorbot/floorbot/blob/main/res/avatars/1-2.png">

# floorbot

The discord bot nobody deserves

She is always doing her best to fulfill our requests no matter how degenerate they might be. Her loyalty is unmatched and she's always waiting for you no matter how long you leave her. It is this reason everyone must protect her at all costs to make sure she is happy.

No body deserves her kindness

## Installation

```bash
git clone https://github.com/floorbot/floorbot           // Clone the repo
```

Rename or copy the [`.env.example`](https://github.com/floorbot/floorbot/blob/main/.env.example) file as `.env` and fill out all the details.
Not all variables are required however for advanced setup please include a MariaDB database as well as Redis server details (when in a sharded environment)

```bash
npm run build                                            // Build the TypeScript
npm start                                                // Run the app
```

## Features

-   [x] NSFW specific commands
-   [x] Context menu command support
-   [x] Autocomplete support for commands
-   [x] Admin specific command control
-   [x] MariaDB database support
-   [x] Redis server support for clustering
-   [ ] Command specific permission control
-   [ ] Command rate limits per user/guild
-   [ ] Guild specific command registration
-   [ ] Seasonal presence updates (christmas/halloween)
-   [ ] RegEx support for commands

### Global Commands

-   [ ] `/floorbot`
    -   [ ] `/floorbot commands` - Add or remove commands from a guild
    -   [ ] `/floorbot about` - Get the bots ping/invite link
    -   [ ] `/floorbot screenshare` - Generate a screenshare link
    -   [ ] `/floorbot guild` - Display stats from the current

### Booru Commands

-   [x] `/danbooru` - [Danbooru](http://danbooru.donmai.us/)
-   [x] `/safebooru` - [Safebooru](http://safebooru.donmai.us/)
-   [x] `/e621` - [e621](https://e621.net/)
-   [x] `/rule34` - [Rule 34](https://rule34.xxx/index.php)
-   [ ] `/pregchan` - [Pregchan](https://pregchan.com/) (scraping) Cloudflare limitations

### Fun Commands

-   [x] `/define` - [Urban Dictionary](https://www.urbandictionary.com/)
-   [ ] `☰ dispute` - Dispute each other's messages
-   [x] `/flip` & `☰ flip` - Flip a coin or text
-   [ ] `/magick` & `☰ magick` - [ImageMagick](https://imagemagick.org/index.php)
-   [ ] `/markov` - Markov chain message generation
-   [ ] `/owoify` & `☰ owoify`  - Owoify a message
-   [ ] `/roll` - Roll a die

### Service Commands

-   [ ] `/weather` - [Open Weather](https://openweathermap.org/)
-   [ ] `/media` - Media player for anything audio related

### Weeb Commands

-   [ ] `/anilist` - [AniList](https://anilist.co/)
-   [ ] `/vtuber` - [Virtual YouTuber](https://virtualyoutuber.fandom.com/wiki/Virtual_YouTuber_Wiki) (scraping) Cloudflare limitations

### Tracker Commands

-   [ ] `/osu` - [osu!](https://osu.ppy.sh/)
-   [ ] `/rocket_league` - [Rocket League Tracker](https://rocketleague.tracker.network/) (scraping) _Unofficial_

### Event commands

-   [ ] `/nnn` - November
-   [ ] `/ddd` - December
-   [ ] `/fff` - February
