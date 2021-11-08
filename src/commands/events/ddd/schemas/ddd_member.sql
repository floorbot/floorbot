CREATE TABLE ddd_member (
    guild_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    season INT NOT NULL,
    timezone VARCHAR(256) NOT NULL,
    CONSTRAINT id PRIMARY KEY (guild_id, user_id, season)
);
