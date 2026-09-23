package ch.unibe.germanistik.namenatlas.webapp.api;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;

import javax.ws.rs.ApplicationPath;
import javax.ws.rs.core.Application;

import ch.unibe.germanistik.namenatlas.query.FilterPredicate;
import ch.unibe.germanistik.namenatlas.query.FixOneOfOpenAPIDefinition;

/**
 * The main REST API implementation.
 *
 * Provides global configuration and documentation for the API.
 */
@ApplicationPath(RestApi.PATH_PREFIX)
public class RestApi extends Application {
    public static final String PATH_PREFIX = "/api";
    public static final String PATH_WILDCARD = PATH_PREFIX + "/*";

    @Override
    public Set<Object> getSingletons() {
        return Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            new ApiDocs(),
            new Filters(),
            new Query(),
            new Users(),
            new Configs()
        )));
    }

    @Override
    public Set<Class<?>> getClasses() {
        return Collections.unmodifiableSet(new HashSet<>(Arrays.asList(
            // Not actual API classes, but need to be included here so that
            // swagger-core will use them during OpenAPI spec generation.
            FilterPredicate.SwaggerUIBugWorkaround.class,
            FixOneOfOpenAPIDefinition.class
        )));
    }

    public static boolean isApiPath(String path) {
        return path.startsWith(PATH_PREFIX);
    }
}
