package ch.unibe.germanistik.namenatlas.webapp.api;

import java.util.logging.Level;
import java.util.logging.Logger;

import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.Provider;


/**
 * Generic error handler for all other exception in the REST API.
 *
 * Sends a response with the HTTP status code 500 and an {@link ErrorMessage} as body
 * and logs the exception as {@link Level#SEVERE}.
 */
@Provider
@Produces(MediaType.APPLICATION_JSON)
public class OtherExceptionMapper extends GenericExceptionMapper<Throwable> {
    @Override
    public Response toResponse(Throwable e) {
        Logger logger = Logger.getLogger(getClass().getName());
        logger.log(Level.SEVERE, e.getMessage(), e);
        return super.toResponse(e);
    }
}
