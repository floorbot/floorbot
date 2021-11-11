CREATE TABLE ddd_settings (
    guild_id VARCHAR(256) NOT NULL,
    year INT NOT NULL,
    channel_id VARCHAR(256),
    event_role_id VARCHAR(256),
    passing_role_id VARCHAR(256),
    failed_role_id VARCHAR(256),
    CONSTRAINT id PRIMARY KEY (guild_id, year)
);
