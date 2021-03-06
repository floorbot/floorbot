CREATE TABLE markov_channel (
    guild_id VARCHAR(64) NOT NULL,
    channel_id VARCHAR(64) NOT NULL,
    minutes INT NOT NULL,
    messages INT NOT NULL,
    posting BOOLEAN NOT NULL,
    tracking BOOLEAN NOT NULL,
    links BOOLEAN NOT NULL,
    mentions BOOLEAN NOT NULL,
    owoify BOOLEAN NOT NULL,
    quoting BOOLEAN NOT NULL,
    CONSTRAINT id PRIMARY KEY (guild_id, channel_id)
);
