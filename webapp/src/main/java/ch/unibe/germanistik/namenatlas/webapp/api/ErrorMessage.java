package ch.unibe.germanistik.namenatlas.webapp.api;

import org.checkerframework.checker.nullness.qual.Nullable;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(description = "Error code and description.")
public class ErrorMessage {
    private final int status;
    private final @Nullable String details;
    public ErrorMessage(int status, @Nullable String details) {
        this.status = status;
        this.details = details;
    }
    @Schema(description = "The error code. Same as the HTTP status code.")
    public int getStatus() { return status; }

    @Schema(description = "Optional message with further error details", nullable = true)
    public @Nullable String getDetails() { return details; }
}