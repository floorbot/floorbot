CREATE TABLE markov_state (
    epoch DECIMAL(64,0) NOT NULL,
    user_id VARCHAR(64) NOT NULL,
    guild_id VARCHAR(64) NOT NULL,
    channel_id VARCHAR(64) NOT NULL,
    message_id VARCHAR(64) NOT NULL,
    message_part INT NOT NULL,
    current_state VARCHAR(4000),
    next_value VARCHAR(4000),
    bot BOOLEAN NOT NULL,
    link BOOLEAN NOT NULL,
    mention BOOLEAN NOT NULL,
    CONSTRAINT id PRIMARY KEY (channel_id, message_id, message_part)
);
