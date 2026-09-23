/* © 2022 Tivano Software GmbH */
package ch.unibe.germanistik.namenatlas.webapp;

import java.util.Arrays;
import java.util.List;

import javax.servlet.ServletConfig;
import javax.servlet.ServletException;
import javax.servlet.annotation.WebServlet;

import com.fasterxml.jackson.jaxrs.json.JacksonJsonProvider;

import org.apache.cxf.interceptor.Interceptor;
import org.apache.cxf.interceptor.security.SecureAnnotationsInterceptor;
import org.apache.cxf.jaxrs.JAXRSServerFactoryBean;
import org.apache.cxf.jaxrs.impl.WebApplicationExceptionMapper;
import org.apache.cxf.jaxrs.servlet.CXFNonSpringJaxrsServlet;

import ch.unibe.germanistik.namenatlas.webapp.api.AccessDeniedExceptionMapper;
import ch.unibe.germanistik.namenatlas.webapp.api.OtherExceptionMapper;
import ch.unibe.germanistik.namenatlas.webapp.api.RestApi;

@WebServlet(
    urlPatterns = {RestApi.PATH_PREFIX, RestApi.PATH_WILDCARD},
    loadOnStartup = 1
)
public class RestApiServlet extends CXFNonSpringJaxrsServlet {
    public RestApiServlet() {
        super(new RestApi());
    }

    @Override
    protected void setAllInterceptors(JAXRSServerFactoryBean bean, ServletConfig servletConfig, String splitChar)
            throws ServletException {
        super.setAllInterceptors(bean, servletConfig, splitChar);
        List<Interceptor<?>> interceptors = bean.getInInterceptors();
        for (Object singleton: getApplication().getSingletons()) {
            SecureAnnotationsInterceptor sai = new SecureAnnotationsInterceptor();
            sai.setSecuredObject(singleton);
            interceptors.add(sai);
        }
        for (Object singleton: getApplication().getClasses()) {
            SecureAnnotationsInterceptor sai = new SecureAnnotationsInterceptor();
            sai.setSecuredObject(singleton);
            interceptors.add(sai);
        }
    }

    @Override
    protected List<?> getProviders(ServletConfig servletConfig, String splitChar) throws ServletException {
        return Arrays.asList(
            new JacksonJsonProvider(),
            new WebApplicationExceptionMapper(),
            new AccessDeniedExceptionMapper(),
            new OtherExceptionMapper()
        );
    }



}
