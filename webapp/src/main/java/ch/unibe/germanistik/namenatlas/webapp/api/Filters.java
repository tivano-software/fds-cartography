package ch.unibe.germanistik.namenatlas.webapp.api;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.InternalServerErrorException;
import javax.ws.rs.NotFoundException;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.checkerframework.checker.nullness.qual.Nullable;

import com.querydsl.jpa.impl.JPAQuery;

import ch.unibe.germanistik.namenatlas.persistence.NamedFilterEntity;
import ch.unibe.germanistik.namenatlas.persistence.QNamedFilterEntity;
import ch.unibe.germanistik.namenatlas.persistence.UserEntity;
import ch.unibe.germanistik.namenatlas.query.ExistingNamedFilter;
import ch.unibe.germanistik.namenatlas.query.NamedFilter;
import ch.unibe.germanistik.namenatlas.webapp.JPAUtil;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

/** Handles CRUD operation on persisted {@link NamedFilter} data */
@Path("/filters")
@Tag(name = "filters", description = "Operations for `NamedFilter` management")
public class Filters {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = "All named filters known to the system",
        content = @Content(
            array = @ArraySchema(
                schema = @Schema(implementation = ExistingNamedFilter.class)
            )
        )
    )
    public Collection<ExistingNamedFilter> getAllFilters(@Context HttpServletRequest req) {
        return JPAUtil.get(req)
            .<NamedFilterEntity>findAll(query -> query.from(QNamedFilterEntity.namedFilterEntity))
            .collect(Collectors.toUnmodifiableList());
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "201",
        description = "New named filter has been created from the submitted data."
    )
    @ApiResponse(
        responseCode = "400",
        description = """
            No new filter has been created because there was a problem with the submitted data.

            This includes the case where the request data satisfies the input schema, but
            there already exists a filter with the same name.
            """,
        content = @Content(schema = @Schema(implementation = ErrorMessage.class))
    )
    public Response createNamedFilter(NamedFilter input, @Context HttpServletRequest req) throws BadRequestException {
        // TODO: Input data validation (delegate to bean validation and add validators to NamedFilter)
        ExistingNamedFilter filter = JPAUtil.get(req).withTransaction(jpaUtil -> {
            if (findByName(jpaUtil, input.getName()) != null) {
                throw new BadRequestException("A filter with this name address already exists.");
            }
            NamedFilterEntity filterEntity = new NamedFilterEntity().from(input);
            UserEntity author = jpaUtil.getCurrentUser();
            filterEntity.setInitialAuthor(author);
            filterEntity.setLastEditor(author);
            Date now = new Date();
            filterEntity.setCreatedAt(now);
            filterEntity.setLastEditedAt(now);
            jpaUtil.persist(filterEntity);
            return filterEntity;
        });
        StringBuffer url = req.getRequestURL();
        if (url.length() == 0 || url.charAt(url.length()-1) != '/') {
            url.append('/');
        }
        url.append(filter.getId());
        try {
            return Response.status(Response.Status.CREATED).location(new URI(url.toString())).build();
        } catch (URISyntaxException e) {
            // Should never happen because the current request should always have a valid URI.
            throw new InternalServerErrorException(e);
        }
    }

    @GET
    @Path("{name}")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = "The (unique) filter with name {name}",
        content = @Content(schema = @Schema(implementation = ExistingNamedFilter.class))
    )
    @ApiResponse(
        responseCode = "404",
        description="No filter with that name found",
        content = @Content(
            schema =  @Schema(implementation = ErrorMessage.class)
        )
    )
    public ExistingNamedFilter getFilterByName(@PathParam("name") String name, @Context HttpServletRequest req) throws NotFoundException {
        @Nullable NamedFilterEntity filterEntity = findByName(JPAUtil.get(req), name);
        if (filterEntity != null) {
            return filterEntity;
        } else {
            throw new NotFoundException("no filter found with name " + name);
        }
    }

    private @Nullable NamedFilterEntity findByName(JPAUtil util, String name) {
        JPAQuery<NamedFilterEntity> query = new JPAQuery<>(util.entityManager());
        return query
            .from(QNamedFilterEntity.namedFilterEntity)
            .where(QNamedFilterEntity.namedFilterEntity.name.eq(name))
            .fetchOne();
    }

    @GET
    @Path("{id:[1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = "The (unique) filter with internal id {id}",
        content = @Content(schema = @Schema(implementation = ExistingNamedFilter.class))
    )
    @ApiResponse(
        responseCode = "404",
        description="No filter with that id found",
        content = @Content(
            schema =  @Schema(implementation = ErrorMessage.class)
        )
    )
    public ExistingNamedFilter getFilterByID(@PathParam("id") int id, @Context HttpServletRequest req) throws NotFoundException {
        NamedFilterEntity filterEntity = JPAUtil.get(req).find(NamedFilterEntity.class, id);
        if (filterEntity != null) {
            return filterEntity;
        } else {
            throw new NotFoundException("no filter found with ID #" + id);
        }
    }

    @PUT
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = "`NamedFilter` entry has been updated sucessfully.\n\n"
                    + "The returned filter entry shows the new updated state.",
        content = @Content(schema = @Schema(implementation = ExistingNamedFilter.class))
    )
    @ApiResponse(
        responseCode = "400",
        description = "No new entry has been created because there was a problem with the submitted data.\n\n"
                    + "This includes the case where the request data satisfies the "
                    + "input schema, but there already exists a different entry with the same name address.",
        content = @Content(schema = @Schema(implementation = ErrorMessage.class))
    )
    @ApiResponse(
        responseCode = "404",
        description="No filter with that id found",
        content = @Content(
            schema =  @Schema(implementation = ErrorMessage.class)
        )
    )
    public ExistingNamedFilter updateFilter(@PathParam("id") int id, NamedFilter filter, @Context HttpServletRequest req) throws NotFoundException, BadRequestException {
        // TODO: Input data validation (delegate to bean validation and add validators to NamedFilter)

        return JPAUtil.get(req).withTransaction(jpaUtil -> {
            @Nullable NamedFilterEntity existingNamedFilter = jpaUtil.find(NamedFilterEntity.class, id);
            if (existingNamedFilter == null) {
                throw new NotFoundException("no filter found with ID #" + id);
            }

            @Nullable NamedFilterEntity conflictingNamedFilter = findByName(jpaUtil, filter.getName());
            if (conflictingNamedFilter != null && !conflictingNamedFilter.equals(existingNamedFilter)) {
                throw new BadRequestException("A different filter entry with this name already exists.");
            }
            // existingNamedFilter.from() updates all fields of the existing filter entry from the values in {@code filter}
            NamedFilterEntity result = existingNamedFilter.from(filter);
            result.setLastEditor(jpaUtil.getCurrentUser());
            result.setLastEditedAt(new Date());
            return result;
        });
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{id}")
    @ApiResponse(
        responseCode = "204",
        description = "`NamedFilter` entry has been deleted."
    )
    @ApiResponse(
        responseCode = "404",
        description="No filter with that id found",
        content = @Content(
            schema =  @Schema(implementation = ErrorMessage.class)
        )
    )
    public Response deleteNamedFilter(@PathParam("id") int id, @Context HttpServletRequest req) throws NotFoundException, BadRequestException {
        return JPAUtil.get(req).withTransaction(jpaUtil -> {
            @Nullable NamedFilterEntity existingNamedFilter = jpaUtil.find(NamedFilterEntity.class, id);
            if (existingNamedFilter == null) {
                throw new NotFoundException("no filter found with ID #" + id);
            }
            jpaUtil.remove(existingNamedFilter);

            // existingNamedFilter.from() updates all fields of the existing filter entry from the values in {@code filter}
            return Response.status(Response.Status.NO_CONTENT).build();
        });
    }

}
