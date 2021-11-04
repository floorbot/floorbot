CREATE TABLE ddd_settings (
    guild_id BIGINT NOT NULL,
    channel_id BIGINT,
    role_id BIGINT,
    CONSTRAINT id PRIMARY KEY (guild_id)
);
