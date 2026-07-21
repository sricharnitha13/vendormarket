package com.vendormarket.vendor_marketplace.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Configuration
public class DatabaseConfig {

    @Value("${DATABASE_URL:}")
    private String databaseUrl;

    @Value("${DATABASE_USERNAME:postgres}")
    private String username;

    @Value("${DATABASE_PASSWORD:password}")
    private String password;

    @Bean
    public DataSource dataSource() throws URISyntaxException {
        // Automatically handle Render's postgres:// URL format
        if (databaseUrl != null && databaseUrl.startsWith("postgres://")) {
            URI dbUri = new URI(databaseUrl);
            String dbUser = dbUri.getUserInfo().split(":")[0];
            String dbPwd = dbUri.getUserInfo().split(":")[1];
            String dbUrl = "jdbc:postgresql://" + dbUri.getHost() + ':' + dbUri.getPort() + dbUri.getPath();

            return DataSourceBuilder.create()
                    .url(dbUrl)
                    .username(dbUser)
                    .password(dbPwd)
                    .driverClassName("org.postgresql.Driver")
                    .build();
        } 
        
        // Fallback for local development or standard jdbc:// URLs
        String url = databaseUrl;
        if (url == null || url.trim().isEmpty()) {
            url = "jdbc:postgresql://localhost:5432/postgres"; 
        }
        
        return DataSourceBuilder.create()
                .url(url)
                .username(username)
                .password(password)
                .driverClassName("org.postgresql.Driver")
                .build();
    }
}
