CREATE TABLE ddd_nut (
    guild_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    epoch BIGINT NOT NULL,
    description VARCHAR(1024) NOT NULL,
    CONSTRAINT id PRIMARY KEY (guild_id, user_id, epoch)
);
