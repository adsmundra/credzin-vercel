rootProject.name = "credzin"

// Version catalogs
dependencyResolutionManagement {
    versionCatalogs {
        create("libs") {
            // Kotlin
            version("kotlin", "1.9.22")
            version("spring-boot", "3.1.9")
            version("spring-dependency-management", "1.1.4")

            // Netflix DGS
            version("dgs", "3.10.2")

            // Database
            version("postgresql", "42.7.2")
            version("flyway", "10.21.0")

            // Testing
            version("junit", "5.10.2")
            version("h2", "2.2.224")

            // Libraries
            library("kotlin-reflect", "org.jetbrains.kotlin", "kotlin-reflect").versionRef("kotlin")
            library("kotlin-stdlib", "org.jetbrains.kotlin", "kotlin-stdlib-jdk8").versionRef("kotlin")
            library("jackson-module-kotlin", "com.fasterxml.jackson.module", "jackson-module-kotlin").version("2.16.1")

            // Spring Boot
            library("spring-boot-starter-web", "org.springframework.boot", "spring-boot-starter-web").versionRef("spring-boot")
            library("spring-boot-starter-data-jpa", "org.springframework.boot", "spring-boot-starter-data-jpa").versionRef("spring-boot")
            library("spring-boot-starter-validation", "org.springframework.boot", "spring-boot-starter-validation").versionRef("spring-boot")
            library("spring-boot-starter-security", "org.springframework.boot", "spring-boot-starter-security").versionRef("spring-boot")
            library("spring-boot-starter-test", "org.springframework.boot", "spring-boot-starter-test").versionRef("spring-boot")

            // Netflix DGS
            library("dgs-spring-boot-starter", "com.netflix.graphql.dgs", "graphql-dgs-spring-boot-starter").versionRef("dgs")

            // Database
            library("postgresql", "org.postgresql", "postgresql").versionRef("postgresql")
            library("flyway-core", "org.flywaydb", "flyway-core").versionRef("flyway")
            library("flyway-database-postgresql", "org.flywaydb", "flyway-database-postgresql").versionRef("flyway")

            // Testing
            library("junit-jupiter", "org.junit.jupiter", "junit-jupiter").versionRef("junit")
            library("junit-platform-launcher", "org.junit.platform", "junit-platform-launcher").version("1.10.2")
            library("h2", "com.h2database", "h2").versionRef("h2")

            // Utilities
            library("lombok", "org.projectlombok", "lombok").version("1.18.30")
        }
    }
}

include(
    "credzin-core",
    "credzin-reward"
)

include("credzin-merchant")