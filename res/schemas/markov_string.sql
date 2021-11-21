CREATE TABLE markov_string (
    epoch DECIMAL(64,0) NOT NULL,
    bot BOOLEAN NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    guild_id VARCHAR(64) NOT NULL,
    channel_id VARCHAR(64) NOT NULL,
    message_id VARCHAR(64) NOT NULL,
    content VARCHAR(4000) NOT NULL,
    CONSTRAINT id PRIMARY KEY (channel_id, message_id)
);
