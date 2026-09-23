package ch.unibe.germanistik.namenatlas.webapp.api;

import java.io.InputStream;
import java.net.URI;

import javax.servlet.ServletConfig;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Application;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.Response.Status;
import javax.ws.rs.core.UriInfo;

import org.checkerframework.checker.nullness.qual.Nullable;

import io.swagger.v3.jaxrs2.integration.resources.BaseOpenApiResource;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.integration.SwaggerConfiguration;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

/** Serves the OpenApi documentation and the SwaggerUI API documentation/exploration UI.  */
@Path("")
public class ApiDocs extends BaseOpenApiResource {

    public ApiDocs() {
        this.openApiConfiguration = new SwaggerConfiguration()
            .openAPI(new OpenAPI()
                .info(new Info()
                    .title("Familiennamenatlas Schweiz")
                    .version("1.0")))
            .prettyPrint(true);
    }

    @GET
    @Produces("text/html")
    @Operation(hidden = true)
    public Response getSwaggerUI(@Context HttpServletRequest request) {
        String uri = request.getRequestURL().toString();
        if (uri.endsWith("/")) {
            // Redirect to the base URI without the "/" to avoid breaking the
            // relative paths in swagger-ui.html
            return Response
                .status(Status.MOVED_PERMANENTLY)
                .location(URI.create(uri.substring(0, uri.length()-1)))
                .build();
        } else {
            @Nullable InputStream resource = request
                .getServletContext()
                .getResourceAsStream("/WEB-INF/resources/swagger-ui.html");
            return resource == null
                ? Response.status(Status.NOT_FOUND).build()
                : Response.ok().entity(resource).build();
        }
    }

    @GET
    @Produces({MediaType.APPLICATION_JSON, "application/yaml"})
    @Operation(hidden = true)
    @Path("openapi.{type:json|yaml}")
    public Response getOpenApiFile(@Context HttpHeaders headers,
                                   @Context ServletConfig config,
                                   @Context Application app,
                                   @Context UriInfo uriInfo,
                                   @PathParam("type") String type) throws Exception
    {
        return super.getOpenApi(headers, config, app, uriInfo, type);
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Operation(hidden = true)
    @Path("openapi")
    public Response getOpenApiJSON(@Context HttpHeaders headers,
                                   @Context ServletConfig config,
                                   @Context Application app,
                                   @Context UriInfo uriInfo) throws Exception
    {
        return getOpenApi(headers, config, app, uriInfo, "json");
    }

    @GET
    @Produces("application/yaml")
    @Operation(hidden = true)
    @Path("openapi")
    public Response getOpenApiYAML(@Context HttpHeaders headers,
                                   @Context ServletConfig config,
                                   @Context Application app,
                                   @Context UriInfo uriInfo) throws Exception
    {
        return getOpenApi(headers, config, app, uriInfo, "yaml");
    }
}
