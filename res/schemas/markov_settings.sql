CREATE TABLE markov_settings (
    guild_id VARCHAR(64) NOT NULL,
    channel_id VARCHAR(64) NOT NULL,
    minutes INT NOT NULL,
    messages INT NOT NULL,
    posting BOOLEAN NOT NULL,
    tracking BOOLEAN NOT NULL,
    links ENUM('enable', 'disable', 'suppress', 'substitute') NOT NULL,
    mentions ENUM('enable', 'disable', 'suppress', 'substitute') NOT NULL,
    owoify BOOLEAN NOT NULL,
    bots BOOLEAN NOT NULL,
    CONSTRAINT id PRIMARY KEY (guild_id, channel_id)
);
