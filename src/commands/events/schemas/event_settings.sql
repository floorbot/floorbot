CREATE TABLE event_settings (
    event_name VARCHAR(256) NOT NULL,
    year INT NOT NULL,
    guild_id VARCHAR(256) NOT NULL,
    channel_id VARCHAR(256),
    event_role_id VARCHAR(256),
    passing_role_id VARCHAR(256),
    failed_role_id VARCHAR(256),
    CONSTRAINT id PRIMARY KEY (event_name, year, guild_id)
);
