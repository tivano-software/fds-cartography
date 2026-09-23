/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.webapp.api;

import javax.ws.rs.core.Response;
import javax.ws.rs.ext.Provider;

import org.apache.cxf.interceptor.security.AccessDeniedException;

@Provider
public class AccessDeniedExceptionMapper extends GenericExceptionMapper<AccessDeniedException> {
    @Override
    protected int responseCodeFor(AccessDeniedException e) {
        return Response.Status.FORBIDDEN.getStatusCode();
    }
}
