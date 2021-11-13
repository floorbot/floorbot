CREATE TABLE ddd_participant (
    guild_id VARCHAR(256) NOT NULL,
    year INT NOT NULL,
    user_id VARCHAR(256) NOT NULL,
    zone VARCHAR(256) NOT NULL,
    failed INT NOT NULL,
    CONSTRAINT id PRIMARY KEY (guild_id, year, user_id)
);
