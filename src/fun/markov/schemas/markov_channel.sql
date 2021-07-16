CREATE TABLE markov_channel (
    minutes INT NOT NULL,
    messages INT NOT NULL,
    enabled BOOLEAN NOT NULL,
    guild_id BIGINT NOT NULL,
    channel_id BIGINT NOT NULL,
    CONSTRAINT id PRIMARY KEY (guild_id, channel_id)
);
