package ch.unibe.germanistik.namenatlas.webapp.api;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.ext.Provider;

/**
 * Generic error handler for {@link WebApplicationException} in the REST API.
 *
 * Sends a response with the appropriate HTTP status code and {@link ErrorMessage}.
 *
 * Note: this cannot be handled by {@link OtherExceptionMapper} because there already
 * is a default exception mapper for {@link WebApplicationException} in CXF, and JAX-RS
 * always uses the most specific exception mapper to handle an exception.
 */
@Provider
public class WebApplicationExceptionMapper extends GenericExceptionMapper<WebApplicationException> {
    @Override
    protected int responseCodeFor(WebApplicationException e) {
        return e.getResponse().getStatus();
    }
}
