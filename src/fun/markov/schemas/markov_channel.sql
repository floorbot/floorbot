CREATE TABLE markov_channel (
    frequency INT NOT NULL,
    enabled BOOLEAN NOT NULL,
    guild_id BIGINT NOT NULL,
    channel_id BIGINT NOT NULL,
    CONSTRAINT id PRIMARY KEY (guild_id, channel_id)
);
