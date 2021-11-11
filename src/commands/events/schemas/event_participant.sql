CREATE TABLE event_participant (
    event_name VARCHAR(256) NOT NULL,
    year INT NOT NULL,
    guild_id VARCHAR(256) NOT NULL,
    user_id VARCHAR(256) NOT NULL,
    zone VARCHAR(256) NOT NULL,
    failed INT NOT NULL,
    CONSTRAINT id PRIMARY KEY (event_name, year, guild_id, user_id)
);
