package ch.unibe.germanistik.namenatlas.webapp.api;

import java.util.List;
import java.util.stream.Collectors;

import javax.servlet.http.HttpServletRequest;
import javax.validation.constraints.Pattern;
import javax.ws.rs.BadRequestException;
import javax.ws.rs.DefaultValue;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.Produces;
import javax.ws.rs.QueryParam;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.HttpHeaders;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.core.StreamingOutput;

import org.apache.cxf.jaxrs.ext.Nullable;

import ch.unibe.germanistik.namenatlas.Layer;
import ch.unibe.germanistik.namenatlas.Location;
import ch.unibe.germanistik.namenatlas.Tokens;
import ch.unibe.germanistik.namenatlas.persistence.NamedFilterEntity;
import ch.unibe.germanistik.namenatlas.query.ExistingNamedFilter;
import ch.unibe.germanistik.namenatlas.query.NamedFilter;
import ch.unibe.germanistik.namenatlas.webapp.JPAUtil;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Actually retrieves {@link Tokens}, {@link ch.unibe.germanistik.namenatlas.Type}, {@link Location} and {@link Layer} data
 * according to the given search criteria.
 */
@Path("/query")
@Tag(name = "query", description = "Retrieve data according to a query definition")
public class Query {

    private static final MediaType MEDIATYPE_CSV_TYPE = new MediaType("text", "csv");
    private static final String MEDIATYPE_CSV = "text/csv";

    public enum Grouping {
        TYPES, LOCATIONS
    }

    public enum TypesLevel {
        GROUPED, INDIVIDUAL, INDIVIDUAL_WITH_GROUP
    }

    @GET
    @Produces({MediaType.APPLICATION_JSON, Query.MEDIATYPE_CSV})
    @Path("{filters}/tokens")
    @ApiResponse(
        responseCode = "200",
        description = "The data",
        content = {
            @Content(mediaType = MediaType.APPLICATION_JSON, schema = @Schema(implementation = TokensTable.class)),
            @Content(mediaType = "text/csv", schema = @Schema(implementation = String.class))
        }
    )
    @Operation(description = """
        Retrieve the tokens count selected by one or more `NamedFilter`. The indivdual filter ids
        are passed as a comma separated list in the `filters` parameter.

        Results are organized according to the `outerGroup` and `innerGroup` parameters
        (for CSV format, `outerGroup` defines the rows and `innerGroup` defines the
        columns, for JSON it defines the result nesting).

        The `locationsLevel` parameter defines the geographical resolution in the results: Tokens from all
        locations with the same value at this level are summed up. The default is to report each individual
        location.

        The `typesLevel` parameter defines the resolution of the types in the results: If the types level
        is `GROUPED`, the all types that match a single filter in the `filters` list are summed up under the
        name of this filter (if a token matches more than one filter, it is summed up under the name of
        the first matching filter). When the types level is `INDIVIDUAL`, individual type names are reported.
        And when the types level is 'INDIVDUAL_WITH_GROUP', both the individual names and the group they fall
        is is reported. Note that this last level may give even more detailed results than 'INDIVIDUAL', when
        a type is in more than one group.

        The `absoluteCountOnly` parameter defines if the JSON result includes only the absolute tokens count
        for each location and type, or if it also includes the ratio of tokens relative to the total number
        of tokens at this location and the layer(s) included in the results. This parameter is ignored if the
        content type is \"text/csv\" - CSV only includes absolute counts.
        Note: Calculating the ratios is a bit slower than reporting absolute token counts only.
        """
    )
    public Response getTokensTable(
            @PathParam("filters") @Pattern(regexp = "[0-9]+(,[0-9]+)?") String filters,
            @DefaultValue(value = "LOCATIONS") @QueryParam("outerGroup") Grouping outerGroupType,
            @DefaultValue(value = "TYPES") @QueryParam("innerGroup") Grouping innerGroupType,
            @DefaultValue(value = "NAME") @QueryParam("locationsLevel") @Nullable Location.Level locationsLevel,
            @DefaultValue(value = "GROUPED") @QueryParam("typesLevel") @Nullable TypesLevel typesLevel,
            @DefaultValue(value = "true") @QueryParam("absoluteCountOnly") boolean absoluteCountOnly,
            @Context HttpServletRequest req,
            @Context HttpHeaders headers
        )
    {
        if (outerGroupType == innerGroupType) {
            throw new BadRequestException("'outerGroup' may not be the same as 'innerGroup'");
        }

        JPAUtil jpaUtil = JPAUtil.get(req);

        List<NamedFilter> namedFilters = java.util.regex.Pattern.compile(",")
            .splitAsStream(filters)
            .map(id -> jpaUtil.find(NamedFilterEntity.class, Integer.parseInt(id)))
            .collect(Collectors.toList());


        TokensTable result = new TokensTable(jpaUtil, namedFilters, locationsLevel, typesLevel, outerGroupType);
        StreamingOutput stream = out -> {
            if (headers.getAcceptableMediaTypes().contains(MEDIATYPE_CSV_TYPE)) {
                result.writeCSV(out);
            } else {
                result.writeJSON(out, absoluteCountOnly);
            }
            out.flush();
        };
        return Response.ok(stream).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{filters}/distribution")
    @ApiResponse(
        responseCode = "200",
        description = "The data",
        content = @Content(mediaType = MediaType.APPLICATION_JSON, schema = @Schema(implementation = TypesDistribution.class))
    )
    @Operation(description = """
        Retrieve the tokens distribution selected by one or more `NamedFilter`. The indivdual filter ids
        are passed as a comma separated list in the `filters` parameter.

        The `locationsLevel` parameter defines the geographical resolution in the results: The returned localized
        distributions are the averaged distributions over all locations with the same value at this level. If
        no `locationsLevel` parameter is given, the returned `TokensDistribution` contains only the averaged tokens
        distributions for each filter in the `filters` list.
        """
    )
    public Response getTokensDistribution(
            @PathParam("filters") @Pattern(regexp = "[0-9]+(,[0-9]+)?") String filters,
            @DefaultValue(value = "NAME") @QueryParam("locationsLevel") @Nullable Location.Level locationsLevel,
            @Context HttpServletRequest req,
            @Context HttpHeaders headers
        )
    {
        JPAUtil jpaUtil = JPAUtil.get(req);

        List<ExistingNamedFilter> namedFilters = java.util.regex.Pattern.compile(",")
            .splitAsStream(filters)
            .map(id -> jpaUtil.find(NamedFilterEntity.class, Integer.parseInt(id)))
            .collect(Collectors.toList());


        TypesDistribution result = new TypesDistribution(jpaUtil, namedFilters, locationsLevel);
        StreamingOutput stream = out -> {
            result.writeJSON(out);
            out.flush();
        };
        return Response.ok(stream).build();
    }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{filters}/distance/locations-to-filters")
    @ApiResponse(
        responseCode = "200",
        description = "The data",
        content = @Content(mediaType = MediaType.APPLICATION_JSON, schema = @Schema(implementation = LocationsToFiltersDistances.class))
    )
    @Operation(description = """
        Retrieve the distances between tokens distributions selected by one or more `NamedFilter`. The indivdual
        filter ids are passed as a comma separated list in the `filters` parameter.

        The `locationsLevel` parameter defines the geographical resolution in the results: The localized
        distributions used to calculate the distances are the averaged distributions over all locations
        with the same value at this level.
        """
    )
    public Response getLocationsToFiltersDistanceMatrix(
            @PathParam("filters") @Pattern(regexp = "[0-9]+(,[0-9]+)?") String filters,
            @DefaultValue(value = "NAME") @QueryParam("locationsLevel") Location.Level locationsLevel,
            @Context HttpServletRequest req,
            @Context HttpHeaders headers
         )
    {
        JPAUtil jpaUtil = JPAUtil.get(req);

        List<ExistingNamedFilter> namedFilters = java.util.regex.Pattern.compile(",")
            .splitAsStream(filters)
            .map(id -> jpaUtil.find(NamedFilterEntity.class, Integer.parseInt(id)))
            .collect(Collectors.toList());


        LocationsToFiltersDistances result = new LocationsToFiltersDistances(jpaUtil, namedFilters, locationsLevel);
        StreamingOutput stream = out -> {
            result.writeJSON(out);
            out.flush();
        };
        return Response.ok(stream).build();
     }

    @GET
    @Produces(MediaType.APPLICATION_JSON)
    @Path("{filters}/distance/locations-to-locations")
    @ApiResponse(
        responseCode = "200",
        description = "The data",
        content = @Content(mediaType = MediaType.APPLICATION_JSON, schema = @Schema(implementation = LocationsToLocationsDistances.class))
    )
    @Operation(description = """
        Retrieve the distance matrix of the tokens distribution selected by one or more `NamedFilter` between
        any two locations selected by those same filters.
        The indivdual filter ids are passed as a comma separated list in the `filters` parameter.

        Since the distance from location A to B is the same as the distance from B to A (i.e. the distance matrix is
        symmetric), the result only contains the lower half of the full distance matrix. Note that the result includes
        the entries on the diagonal (for easier parsing), although those are always 0 (because the distance
        from A to A is 0).

        The `locationsLevel` parameter defines the geographical resolution in the results: The localized
        distributions used to calculate the distances are the averaged distributions over all locations
        with the same value at this level.
        """
    )
    public Response getLocationsToLocationsDistanceMatrix(
            @PathParam("filters") @Pattern(regexp = "[0-9]+(,[0-9]+)?") String filters,
            @DefaultValue(value = "NAME") @QueryParam("locationsLevel") Location.Level locationsLevel,
            @Context HttpServletRequest req,
            @Context HttpHeaders headers
        )
    {
        JPAUtil jpaUtil = JPAUtil.get(req);

        List<ExistingNamedFilter> namedFilters = java.util.regex.Pattern.compile(",")
            .splitAsStream(filters)
            .map(id -> jpaUtil.find(NamedFilterEntity.class, Integer.parseInt(id)))
            .collect(Collectors.toList());


        LocationsToLocationsDistances result = new LocationsToLocationsDistances(jpaUtil, namedFilters, locationsLevel);
        StreamingOutput stream = out -> {
            result.writeJSON(out);
            out.flush();
        };
        return Response.ok(stream).build();
    }

}
