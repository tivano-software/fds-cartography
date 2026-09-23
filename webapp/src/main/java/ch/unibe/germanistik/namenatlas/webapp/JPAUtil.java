package ch.unibe.germanistik.namenatlas.webapp;

import java.security.Principal;
import java.util.function.Function;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Stream;

import javax.servlet.ServletContext;
import javax.servlet.ServletContextEvent;
import javax.servlet.ServletContextListener;
import javax.servlet.ServletRequest;
import javax.servlet.ServletRequestEvent;
import javax.servlet.ServletRequestListener;
import javax.servlet.annotation.WebListener;
import javax.servlet.http.HttpServletRequest;

import org.checkerframework.checker.nullness.qual.EnsuresNonNullIf;
import org.checkerframework.checker.nullness.qual.MonotonicNonNull;
import org.checkerframework.checker.nullness.qual.Nullable;
import org.checkerframework.dataflow.qual.Pure;

import com.querydsl.core.NonUniqueResultException;
import com.querydsl.jpa.impl.JPAQuery;

import ch.unibe.germanistik.namenatlas.persistence.PersistenceConfig;
import ch.unibe.germanistik.namenatlas.persistence.QUserEntity;
import ch.unibe.germanistik.namenatlas.persistence.UserEntity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.EntityTransaction;
import jakarta.persistence.Persistence;

/**
 * Manages the {@link EntityManagerFactory} and {@link EntityManager} for the web application
 * and provides convenience methods to query, load and store persistent entities.
 */
public class JPAUtil {
    private static final String EMF_CONTEXT_KEY  = JPAUtil.class.getName() + "#EMF";
    private static final String INSTANCE_ATTRIBUTE_KEY = JPAUtil.class.getName();

    @WebListener
    public static class Listener implements ServletContextListener, ServletRequestListener {

        @Override
        public void contextDestroyed(ServletContextEvent sce) {
            ServletContext ctx = sce.getServletContext();
            @Nullable EntityManagerFactory emf = (EntityManagerFactory)ctx.getAttribute(EMF_CONTEXT_KEY);
            if (emf != null) {
                emf.close();
            }
            ctx.removeAttribute(EMF_CONTEXT_KEY);
        }

        @Override
        public void contextInitialized(ServletContextEvent sce) {
            EntityManagerFactory emf = Persistence.createEntityManagerFactory(PersistenceConfig.PERSISTENCE_UNIT);
            sce.getServletContext().setAttribute(EMF_CONTEXT_KEY, emf);
        }

        @Override
        public void requestDestroyed(ServletRequestEvent sre) {
            ServletRequest req = sre.getServletRequest();
            @Nullable JPAUtil instance = (@Nullable JPAUtil) req.getAttribute(INSTANCE_ATTRIBUTE_KEY);
            if (instance != null) {
                instance.em.close();
                req.removeAttribute(INSTANCE_ATTRIBUTE_KEY);
            }
        }
    }

    private final EntityManager em;
    private final @MonotonicNonNull Principal currentUser;
    private JPAUtil(HttpServletRequest req) {
        @Nullable EntityManagerFactory emf = (@Nullable EntityManagerFactory) req.getServletContext().getAttribute(EMF_CONTEXT_KEY);
        if (emf != null) {
            this.em = emf.createEntityManager();
        } else {
            throw new IllegalStateException("Expected an EntityManagerFactory at servlet context key " + JPAUtil.EMF_CONTEXT_KEY);
        }
        this.currentUser = req.getUserPrincipal();
    }

    /**
     * Get an {@link EntityManager} for use while handling the request.
     *
     * Note: The returned entity manager will be closed after the request finished.
     */
    public static JPAUtil get(HttpServletRequest req) {
        @Nullable JPAUtil instance = (@Nullable JPAUtil) req.getAttribute(INSTANCE_ATTRIBUTE_KEY);
        if (instance == null) {
            instance = new JPAUtil(req);
            req.setAttribute(INSTANCE_ATTRIBUTE_KEY, instance);
        }
        return instance;
    }

    public EntityManager entityManager() { return em; }

    /**
     * Runs a block of code in a transaction. {@code withTransaction()} guarantees that the
     * transaction is active at the start of the code block, commits the transaction when the
     * code block finishes without an exception, and rolls back the transaction if any exception
     * is thrown from the code block. For advanced use cases, the {@link EntityManager} associated
     * with the transaction is passed to the code block as a parameter.
     *
     * {@code withTransaction()} returns whatever the passed code block returns.
     */
    public <T> T withTransaction(Function<JPAUtil, T> code) {
        EntityTransaction tx = em.getTransaction();
        try {
            if (!tx.isActive()) {
                tx.begin();
            }
            T result = code.apply(this);
            tx.commit();
            return result;
        } catch (RuntimeException | Error e) {
            if (tx.isActive()) {
                try {
                    tx.rollback();
                } catch(Throwable t) {
                    Logger.getLogger(getClass().getName()).log(Level.WARNING, "Error while rolling back a database transaction", t);
                }
            }
            throw e;
        }
    }

    /**
     * Persist a new entity
     */
    public void persist(Object entity) {
        em.persist(entity);
    }

    /**
     * Find an entity by its primary key.
     */
    public <E> @Nullable E find(Class<E> entityType, Object key) {
        return em.find(entityType, key);
    }

    /**
     * Find a unqiue entity by a JPAQuery
     * @throws NonUniqueResultException if the query returns more than one result
     */
    public <E> @Nullable E find(Function<JPAQuery<E>, JPAQuery<E>> queryDefinition) throws NonUniqueResultException {
        return queryDefinition.apply(new JPAQuery<E>(em)).fetchOne();
    }
    /**
     * Find all entities by a JPAQuery
     */
    public <E> Stream<E> findAll(Function<JPAQuery<E>, JPAQuery<E>> queryDefinition) {
        return queryDefinition.apply(new JPAQuery<E>(em)).stream();
    }

    /**
     * Remove an entity
     */
    public void remove(Object entity) {
        em.remove(entity);
    }

    /**
     * Check if we have a current user
     */
    @Pure
    @EnsuresNonNullIf(expression = "currentUser", result = true)
    public boolean haveCurrentUser() { return currentUser != null; }

    /**
     * Get the current user
     * @throws IllegalStateException if {@link #haveCurrentUser()} returns <code>false</code>
     */
    public UserEntity getCurrentUser() {
        if (haveCurrentUser()) {
            String email = currentUser.getName();
            @Nullable UserEntity user = find(query ->
                query.from(QUserEntity.userEntity)
                     .where(QUserEntity.userEntity.email.eq(email))
            );
            if (user != null) {
                return user;
            } else {
                throw new IllegalStateException("No user data found for " + email);
            }
        } else {
            throw new IllegalStateException("getCurrentUser() must not be called when haveCurrentUser() returns false.");
        }
    }

}
