/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.webapp.api;

import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;

public abstract class GenericExceptionMapper<E extends Throwable> implements ExceptionMapper<E> {
    @Override
    public Response toResponse(E e) {
        int code = responseCodeFor(e);
        return Response
            .status(code)
            .type(MediaType.APPLICATION_JSON)
            .entity(new ErrorMessage(code, e.getMessage()))
            .build();
    }

    protected int responseCodeFor(E e) {
        return Response.Status.INTERNAL_SERVER_ERROR.getStatusCode();
    }

}
