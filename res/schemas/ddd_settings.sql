CREATE TABLE ddd_settings (
    guild_id VARCHAR(64) NOT NULL,
    year INT NOT NULL,
    channel_id VARCHAR(64),
    event_role_id VARCHAR(64),
    passing_role_id VARCHAR(64),
    failed_role_id VARCHAR(64),
    CONSTRAINT id PRIMARY KEY (guild_id, year)
);
