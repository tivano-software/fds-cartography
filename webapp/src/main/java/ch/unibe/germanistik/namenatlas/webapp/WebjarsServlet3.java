package ch.unibe.germanistik.namenatlas.webapp;

import javax.servlet.annotation.WebServlet;

import org.webjars.servlet.WebjarsServlet;

/** Make  {@link WebjarsServlet} available in a modern servlet environment. */
@WebServlet(urlPatterns = {"/webjars", "/webjars/*"}, name = "Webjars", loadOnStartup = 1)
public class WebjarsServlet3 extends WebjarsServlet {}