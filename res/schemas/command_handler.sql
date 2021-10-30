CREATE TABLE command_handler (
    application_id BIGINT NOT NULL,
    command_id BIGINT NOT NULL,
    guild_id BIGINT,
    handler_id VARCHAR(256) NOT NULL,

    CONSTRAINT id PRIMARY KEY (application_id, command_id)
);
