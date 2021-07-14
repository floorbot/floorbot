CREATE TABLE weather_link (
    user_id BIGINT NOT NULL,
    guild_id BIGINT NOT NULL,
    name VARCHAR(256) NOT NULL,
    state VARCHAR(256),
    country VARCHAR(256),
    lat FLOAT NOT NULL,
    lon FLOAT NOT NULL,
    CONSTRAINT id PRIMARY KEY (user_id, guild_id)
);
