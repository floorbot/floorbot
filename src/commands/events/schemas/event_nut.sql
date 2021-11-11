CREATE TABLE event_nut (
    event_name VARCHAR(256) NOT NULL,
    year INT NOT NULL,
    guild_id VARCHAR(256) NOT NULL,
    user_id VARCHAR(256) NOT NULL,
    epoch BIGINT NOT NULL,
    description VARCHAR(1024),
    CONSTRAINT id PRIMARY KEY (event_name, year, guild_id, user_id, epoch)
);
