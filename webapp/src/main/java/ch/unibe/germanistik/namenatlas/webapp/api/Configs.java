package ch.unibe.germanistik.namenatlas.webapp.api;

import java.util.Collection;
import java.util.Date;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
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

import ch.unibe.germanistik.namenatlas.ExistingUser;
import ch.unibe.germanistik.namenatlas.config.Configuration;
import ch.unibe.germanistik.namenatlas.config.ExistingConfiguration;
import ch.unibe.germanistik.namenatlas.persistence.ConfigurationEntity;
import ch.unibe.germanistik.namenatlas.persistence.QConfigurationEntity;
import ch.unibe.germanistik.namenatlas.persistence.UserEntity;
import ch.unibe.germanistik.namenatlas.webapp.JPAUtil;
import io.swagger.v3.oas.annotations.media.ArraySchema;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

/** Handles CRUD operation on persisted {@link Configuration} data */
@Path("/config")
@Tag(name = "config", description = "Operations for `Configuration` management")
public class Configs {

    public static final class ConfigListEntry {
        private final ExistingConfiguration data;
        private final String dataUrl;

        public ConfigListEntry(String baseUrl, ExistingConfiguration data) {
            this.data = data;
            this.dataUrl = baseUrl + data.getType() + "/" + data.getId();
        }

        public int getId() { return data.getId(); }
        public String getType() { return data.getType(); }
        public String getName() { return data.getName(); }
        public String getLink() { return dataUrl; }

        public ExistingUser getInitialAuthor() { return data.getInitialAuthor(); }
        public ExistingUser getLastEditor() { return data.getLastEditor(); }
        public Date getLastEditedAt() { return data.getLastEditedAt(); }
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = "All configurations known to the system",
        content = @Content(
            array = @ArraySchema(
                schema = @Schema(implementation = ConfigListEntry.class)
            )
        )
    )
    public Collection<ConfigListEntry> configurations(@Context HttpServletRequest req) {
        final String baseURL = normalizedRequestURL(req).toString();
        return JPAUtil.get(req)
            .<ConfigurationEntity>findAll(query -> query.from(QConfigurationEntity.configurationEntity))
            .map(entity -> new ConfigListEntry(baseURL, entity))
            .collect(Collectors.toUnmodifiableList());
    }

    @POST
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "201",
        description = "The newly created entry.",
        content = @Content(schema = @Schema(implementation = ExistingConfiguration.class))
    )
    @ApiResponse(
        responseCode = "400",
        description = """
            No new configuration been created because there was a problem with the submitted data.

            This includes the case where the request data satisfies the input schema, but
            there already exists a configuration with the same type and name.
            """,
        content = @Content(schema = @Schema(implementation = ErrorMessage.class))
    )
    public Response createConfiguration(Configuration input, @Context HttpServletRequest req) throws BadRequestException {
        // TODO: Input data validation (delegate to bean validation and add validators to Configuration)
        ExistingConfiguration config = JPAUtil.get(req).withTransaction(jpaUtil -> {
            if (findByTypeAndName(jpaUtil, input.getType(), input.getName()) != null) {
                throw new BadRequestException("A configuration with this type and name already exists.");
            }
            ConfigurationEntity configEntity = new ConfigurationEntity().from(input);
            UserEntity author = jpaUtil.getCurrentUser();
            configEntity.setInitialAuthor(author);
            configEntity.setLastEditor(author);
            Date now = new Date();
            configEntity.setCreatedAt(now);
            configEntity.setLastEditedAt(now);
            jpaUtil.persist(configEntity);
            return configEntity;
        });
        StringBuffer url = normalizedRequestURL(req);
        url.append(config.getType()).append("/").append(config.getId());
        return Response.status(Response.Status.CREATED).entity(config).build();
    }

    @GET
    @Path("{type}")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = "All configurations of type {type}",
        content = @Content(
            array = @ArraySchema(
                schema = @Schema(implementation = ExistingConfiguration.class)
            )
        )
    )
    public Collection<ConfigListEntry> configurationsForType(@PathParam("type") String type, @Context HttpServletRequest req) {
        final String baseURL = normalizedRequestURL(req).toString();
        QConfigurationEntity config = QConfigurationEntity.configurationEntity;
        return JPAUtil.get(req)
            .<ConfigurationEntity>findAll(query -> query
                .from(config)
                .where(config.type.eq(type))
            )
            .map(entity -> new ConfigListEntry(baseURL, entity))
            .collect(Collectors.toUnmodifiableList());
    }


    @GET
    @Path("{type}/{name}")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = "The (unique) filter with type {type} and name {name}",
        content = @Content(schema = @Schema(implementation = ExistingConfiguration.class))
    )
    @ApiResponse(
        responseCode = "404",
        description="No filter with that type and name found",
        content = @Content(
            schema =  @Schema(implementation = ErrorMessage.class)
        )
    )
    public ExistingConfiguration getConfigByTypeAndName(
        @PathParam("type") String type,
        @PathParam("name") String name,
        @Context HttpServletRequest req)
    throws NotFoundException {
        @Nullable ConfigurationEntity configEntity = findByTypeAndName(JPAUtil.get(req), type, name);
        if (configEntity != null) {
            return configEntity;
        } else {
            throw new NotFoundException("no configuration found with type " + type + " and name " + name);
        }
    }

    @GET
    @Path("{type}/{id:[1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = "The (unique) filter with type {type} and id {id}",
        content = @Content(schema = @Schema(implementation = ExistingConfiguration.class))
    )
    @ApiResponse(
        responseCode = "404",
        description="No filter with that type and id found",
        content = @Content(
            schema =  @Schema(implementation = ErrorMessage.class)
        )
    )
    public ExistingConfiguration getConfigByTypeAndId(
        @PathParam("type") String type,
        @PathParam("id") int id,
        @Context HttpServletRequest req)
    throws NotFoundException {
        @Nullable ConfigurationEntity configEntity = findByTypeAndId(JPAUtil.get(req), type, id);
        if (configEntity != null) {
            return configEntity;
        } else {
            throw new NotFoundException("no configuration found with type " + type + " and id " + id);
        }
    }

    @PUT
    @Path("{type}/{id:[1-9][0-9]*}")
    @Produces(MediaType.APPLICATION_JSON)
    @Consumes(MediaType.APPLICATION_JSON)
    @ApiResponse(
        responseCode = "200",
        description = """
            `Configuration` entry has been updated sucessfully.

            The returned configuration entry shows the new updated state.
            """,
        content = @Content(schema = @Schema(implementation = ExistingConfiguration.class))
    )
    @ApiResponse(
        responseCode = "400",
        description = """
            No new entry has been created because there was a problem with the submitted data.

            This includes the case where the data satisfies the schema, but there already
            exists a configuration with the specified type and name, and that configuration
            is not identical to the configuration identified by {type} and {id}.
            """,
        content = @Content(schema = @Schema(implementation = ErrorMessage.class))
    )
    @ApiResponse(
        responseCode = "404",
        description="No configuration with that type and id found",
        content = @Content(
            schema =  @Schema(implementation = ErrorMessage.class)
        )
    )
    public ExistingConfiguration updateConfig(
        @PathParam("type") String type,
        @PathParam("id") int id,
        Configuration config,
        @Context HttpServletRequest req
    ) throws NotFoundException, BadRequestException {
        // TODO: Input data validation (delegate to bean validation and add validators to Configuration)

        return JPAUtil.get(req).withTransaction(jpaUtil -> {
            @Nullable ConfigurationEntity existingConfiguration = findByTypeAndId(jpaUtil, type, id);
            if (existingConfiguration == null) {
                throw new NotFoundException("no filter found with ID #" + id);
            }

            @Nullable ConfigurationEntity conflictingConfig = findByTypeAndName(jpaUtil, config.getType(), config.getName());
            if (conflictingConfig != null && !conflictingConfig.equals(existingConfiguration)) {
                throw new BadRequestException("A different configuration entry with this type and name already exists.");
            }
            // existingConfiguration.from() updates all fields of the existing config entry from the values in {@code config}
            ConfigurationEntity result = existingConfiguration.from(config);
            result.setLastEditor(jpaUtil.getCurrentUser());
            result.setLastEditedAt(new Date());
            return result;
        });
    }

    @DELETE
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{type}/{id:[1-9][0-9]*}")
    @ApiResponse(
        responseCode = "204",
        description = "`Configuration` entry has been deleted."
    )
    @ApiResponse(
        responseCode = "404",
        description="No configuration with that type and id found",
        content = @Content(
            schema =  @Schema(implementation = ErrorMessage.class)
        )
    )
    public Response deleteConfig(
        @PathParam("type") String type,
        @PathParam("id") int id,
        @Context HttpServletRequest req
    ) throws NotFoundException, BadRequestException {
        return JPAUtil.get(req).withTransaction(jpaUtil -> {
            @Nullable ConfigurationEntity existingConfig = findByTypeAndId(jpaUtil, type, id);
            if (existingConfig == null) {
                throw new NotFoundException("no configuration found with type " + type + " and ID #" + id);
            }
            jpaUtil.remove(existingConfig);
            return Response.status(Response.Status.NO_CONTENT).build();
        });
    }

    private @Nullable ConfigurationEntity findByTypeAndId(JPAUtil util, String type, int id) {
        ConfigurationEntity config = util.find(ConfigurationEntity.class, id);
        return config != null && config.getType().equals(type) ? config : null;
    }

    private @Nullable ConfigurationEntity findByTypeAndName(JPAUtil util, String type, String name) {
        JPAQuery<ConfigurationEntity> query = new JPAQuery<>(util.entityManager());
        QConfigurationEntity config = QConfigurationEntity.configurationEntity;
        return query
            .from(config)
            .where(config.name.eq(name).and(config.type.eq(type)))
            .fetchOne();
    }

    private StringBuffer normalizedRequestURL(HttpServletRequest req) {
        StringBuffer url = req.getRequestURL();
        if (url.length() == 0 || url.charAt(url.length()-1) != '/') {
            url.append('/');
        }
        return url;
    }
}
