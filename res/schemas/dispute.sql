CREATE TABLE dispute (
    message_id VARCHAR(64) NOT NULL,
    channel_id VARCHAR(64) NOT NULL,
    guild_id VARCHAR(64),
    disputer_id VARCHAR(64) NOT NULL,
    disputee_id VARCHAR(64) NOT NULL,
    content VARCHAR(4096) NOT NULL,
    epoch DECIMAL(64,0) NOT NULL,
    CONSTRAINT id PRIMARY KEY (message_id, channel_id)
);
