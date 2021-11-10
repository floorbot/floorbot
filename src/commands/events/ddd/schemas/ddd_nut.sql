CREATE TABLE ddd_nut (
    guild_id VARCHAR(256) NOT NULL,
    year INT NOT NULL,
    user_id VARCHAR(256) NOT NULL,
    epoch BIGINT NOT NULL,
    description VARCHAR(1024),
    CONSTRAINT id PRIMARY KEY (guild_id, year, user_id, epoch)
);
