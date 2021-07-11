CREATE TABLE markov_string (
    epoch BIGINT NOT NULL,
    bot BOOLEAN NOT NULL,
    user_id BIGINT NOT NULL,
    guild_id BIGINT NOT NULL,
    channel_id BIGINT NOT NULL,
    message_id BIGINT NOT NULL,
    content VARCHAR(4000) NOT NULL,
    CONSTRAINT id PRIMARY KEY (channel_id, message_id)
);
