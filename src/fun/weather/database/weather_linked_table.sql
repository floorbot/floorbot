CREATE TABLE weather_linked (
    user_id BIGINT NOT NULL,
    guild_id BIGINT NOT NULL,
    city_name VARCHAR(256) NOT NULL,
    state_code VARCHAR(256),
    country_code VARCHAR(256),
    lat DOUBLE NOT NULL,
    lon DOUBLE NOT NULL,
    CONSTRAINT id PRIMARY KEY (user_id, guild_id)
);
