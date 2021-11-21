CREATE TABLE ddd_nut (
    guild_id VARCHAR(64) NOT NULL,
    year INT NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    epoch DECIMAL(64,0) NOT NULL,
    description VARCHAR(1024),
    CONSTRAINT id PRIMARY KEY (guild_id, year, user_id, epoch)
);
