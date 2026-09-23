package ch.unibe.germanistik.namenatlas.webapp.api;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collection;
import java.util.stream.Collectors;

import javax.annotation.security.RolesAllowed;
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
import javax.ws.rs.core.SecurityContext;

import com.querydsl.jpa.impl.JPAQuery;

import org.checkerframework.checker.nullness.qual.Nullable;

import ch.unibe.germanistik.namenatlas.ExistingUser;
import ch.unibe.germanistik.namenatlas.User;
import ch.unibe.germanistik.namenatlas.persistence.QUserEntity;
import ch.unibe.germanistik.namenatlas.persistence.UserEntity;
import ch.unibe.germanistik.namenatlas.webapp.JPAUtil;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

/** Handles CRUD operation on persisted {@link User} data */
@Path("/users")
@Tag(name = "users", description = "Operations for user management")
// TODO: Only allow access for {@link User.Role.ADMIN}
@RolesAllowed("ADMIN")
public class Users {

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = "All users known to the system",
        content = @Content(
            array = @ArraySchema(
                schema = @Schema(implementation = ExistingUser.class)
            )
        )
    )
    public Collection<ExistingUser> getAllUsers(@Context HttpServletRequest req) {
        return JPAUtil.get(req)
            .<UserEntity>findAll(query -> query.from(QUserEntity.userEntity))
            .collect(Collectors.toUnmodifiableList());
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "201",
        description = "New user entry has been created from the submitted data."
    )
    @ApiResponse(
        responseCode = "400",
        description = "No new entry has been created because there was a problem with the submitted data.\n\n"
                    + "This includes the case where the request data satisfies the input schema, but "
                    + "there already exists an entry with the same email address.",
        content = @Content(schema = @Schema(implementation = ErrorMessage.class))
    )
    public Response createUser(User input, @Context HttpServletRequest req) throws BadRequestException {
        // TODO: Input data validation (delegate to bean validation and add validators to User)
        ExistingUser user = JPAUtil.get(req).withTransaction(jpaUtil -> {
            if (findByEmail(jpaUtil, input.getEmail()) != null) {
                throw new BadRequestException("A user entry with this email address already exists.");
            }
            UserEntity userEntity = new UserEntity().from(input);
            jpaUtil.persist(userEntity);
            return userEntity;
        });
        StringBuffer url = req.getRequestURL();
        if (url.length() == 0 || url.charAt(url.length()-1) != '/') {
            url.append('/');
        }
        url.append(user.getId());
        try {
            return Response.status(Response.Status.CREATED).location(new URI(url.toString())).build();
        } catch (URISyntaxException e) {
            // Should never happen because the current request should always have a valid URI.
            throw new InternalServerErrorException(e);
        }
    }

    @GET
    @Path("{email}")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = "The (unique) user account with email address {email}",
        content = @Content(schema = @Schema(implementation = ExistingUser.class))
    )
    @ApiResponse(
        responseCode = "404",
        description="No user with that email address found",
        content = @Content(
            schema =  @Schema(implementation = ErrorMessage.class)
        )
    )
    public ExistingUser getUserByEmail(@PathParam("email") String email, @Context HttpServletRequest req) throws NotFoundException {
        @Nullable UserEntity userEntity = findByEmail(JPAUtil.get(req), email);
        if (userEntity != null) {
            return userEntity;
        } else {
            throw new NotFoundException("no user found with email " + email);
        }
    }

    private @Nullable UserEntity findByEmail(JPAUtil util, String email) {
        JPAQuery<UserEntity> query = new JPAQuery<>(util.entityManager());
        return query
            .from(QUserEntity.userEntity)
            .where(QUserEntity.userEntity.email.eq(email))
            .fetchOne();
    }

    @GET
    @Path("{id:[1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = "The (unique) user account with internal id {id}",
        content = @Content(schema = @Schema(implementation = ExistingUser.class))
    )
    @ApiResponse(
        responseCode = "404",
        description="No user with that id found",
        content = @Content(
            schema =  @Schema(implementation = ErrorMessage.class)
        )
    )
    public ExistingUser getUserByID(@PathParam("id") int id, @Context HttpServletRequest req) throws NotFoundException {
        UserEntity userEntity = JPAUtil.get(req).find(UserEntity.class, id);
        if (userEntity != null) {
            return userEntity;
        } else {
            throw new NotFoundException("no user found with ID #" + id);
        }
    }

    @GET
    @Path("me")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = "The current user",
        content = @Content(schema = @Schema(implementation = ExistingUser.class))
    )
    @RolesAllowed({"USER", "ADMIN"})
    public ExistingUser getCurrentUser(@Context SecurityContext security, @Context HttpServletRequest req) throws NotFoundException {
        return JPAUtil.get(req).getCurrentUser();
    }

    @PUT
    @Path("{id}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = "User entry has been updated sucessfully.\n\n"
                    + "The returned user entry shows the new updated state.",
        content = @Content(schema = @Schema(implementation = ExistingUser.class))
    )
    @ApiResponse(
        responseCode = "400",
        description = "No new entry has been created because there was a problem with the submitted data.\n\n"
                    + "This includes the case where the request data satisfies the "
                    + "input schema, but there already exists a different entry with the same email address.",
        content = @Content(schema = @Schema(implementation = ErrorMessage.class))
    )
    @ApiResponse(
        responseCode = "404",
        description="No user with that id found",
        content = @Content(
            schema =  @Schema(implementation = ErrorMessage.class)
        )
    )
    public ExistingUser updateUser(@PathParam("id") int id, User user, @Context HttpServletRequest req) throws NotFoundException, BadRequestException {
        // TODO: Input data validation (delegate to bean validation and add validators to User)

        return JPAUtil.get(req).withTransaction(jpaUtil -> {
            @Nullable UserEntity existingUser = jpaUtil.find(UserEntity.class, id);
            if (existingUser == null) {
                throw new NotFoundException("no user found with ID #" + id);
            }

            @Nullable UserEntity conflictingUser = findByEmail(jpaUtil, user.getEmail());
            if (conflictingUser != null && !conflictingUser.equals(existingUser)) {
                throw new BadRequestException("A different user entry with this email address already exists.");
            }
            // existingUser.from() updates all fields of the existing user entry from the values in {@code user}
            return existingUser.from(user);
        });
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{id}")
    @ApiResponse(
        responseCode = "204",
        description = "User entry has been deleted."
    )
    @ApiResponse(
        responseCode = "404",
        description="No user with that id found",
        content = @Content(
            schema =  @Schema(implementation = ErrorMessage.class)
        )
    )
    public Response deleteUser(@PathParam("id") int id, @Context HttpServletRequest req) throws NotFoundException, BadRequestException {
        return JPAUtil.get(req).withTransaction(jpaUtil -> {
            @Nullable UserEntity existingUser = jpaUtil.find(UserEntity.class, id);
            if (existingUser == null) {
                throw new NotFoundException("no user found with ID #" + id);
            }
            jpaUtil.remove(existingUser);

            // existingUser.from() updates all fields of the existing user entry from the values in {@code user}
            return Response.status(Response.Status.NO_CONTENT).build();
        });
    }

}
